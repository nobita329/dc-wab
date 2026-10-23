import { DatabaseManager } from "../database/connection.js";
import { HomePageContent } from "@nova/shared";

export class ContentRepository {
  private getDb() {
    return DatabaseManager.getInstance().getConnection("content");
  }

  public getPublished(): HomePageContent {
    const row = this.getDb().prepare(`
      SELECT data, version, published_at, created_at
      FROM home_content_revisions
      WHERE is_published = 1
      ORDER BY id DESC LIMIT 1
    `).get() as { data: string; version: number; published_at: string; created_at: string } | undefined;

    if (!row) {
      throw new Error("No published home page content found");
    }

    const content = JSON.parse(row.data) as HomePageContent;
    content.version = row.version;
    content.publishedAt = row.published_at;
    content.updatedAt = row.created_at;
    return content;
  }

  public getDraft(): HomePageContent | null {
    // Find latest draft if newer than published
    const draftRow = this.getDb().prepare(`
      SELECT id, data, version, created_at
      FROM home_content_revisions
      WHERE is_published = 0
      ORDER BY id DESC LIMIT 1
    `).get() as { id: number; data: string; version: number; created_at: string } | undefined;

    if (!draftRow) {
      return null;
    }

    const publishedRow = this.getDb().prepare(`
      SELECT id FROM home_content_revisions WHERE is_published = 1 ORDER BY id DESC LIMIT 1
    `).get() as { id: number } | undefined;

    if (publishedRow && draftRow.id < publishedRow.id) {
      // Draft is older than the current published content
      return null;
    }

    const content = JSON.parse(draftRow.data) as HomePageContent;
    content.version = draftRow.version;
    content.updatedAt = draftRow.created_at;
    return content;
  }

  public saveDraft(content: HomePageContent, author: string): HomePageContent {
    const published = this.getPublished();
    const nextVersion = (published?.version ?? 0) + 1;
    const now = new Date().toISOString();

    const payload: HomePageContent = {
      ...content,
      version: nextVersion,
      updatedAt: now,
    };

    // Replace any existing draft
    const db = this.getDb();
    db.exec("BEGIN TRANSACTION;");
    try {
      db.prepare("DELETE FROM home_content_revisions WHERE is_published = 0").run();
      db.prepare(`
        INSERT INTO home_content_revisions (version, is_published, data, created_at, created_by)
        VALUES (?, 0, ?, ?, ?)
      `).run(nextVersion, JSON.stringify(payload), now, author);
      db.exec("COMMIT;");
    } catch (err) {
      db.exec("ROLLBACK;");
      throw err;
    }

    return payload;
  }

  public publish(content: HomePageContent, author: string): HomePageContent {
    const published = this.getPublished();
    const nextVersion = (published?.version ?? 0) + 1;
    const now = new Date().toISOString();

    const payload: HomePageContent = {
      ...content,
      version: nextVersion,
      publishedAt: now,
      updatedAt: now,
    };

    const db = this.getDb();
    db.exec("BEGIN TRANSACTION;");
    try {
      // Clear any pending draft
      db.prepare("DELETE FROM home_content_revisions WHERE is_published = 0").run();

      // Insert new published revision
      db.prepare(`
        INSERT INTO home_content_revisions (version, is_published, data, created_at, published_at, created_by)
        VALUES (?, 1, ?, ?, ?, ?)
      `).run(nextVersion, JSON.stringify(payload), now, now, author);

      db.exec("COMMIT;");
    } catch (err) {
      db.exec("ROLLBACK;");
      throw err;
    }

    return payload;
  }

  public getPublishCount(): number {
    const row = this.getDb().prepare(`
      SELECT count(*) as count FROM home_content_revisions WHERE is_published = 1
    `).get() as { count: number };
    return row.count;
  }

  public getRevisions(): Array<{
    id: number;
    version: number;
    isPublished: boolean;
    createdAt: string;
    publishedAt: string | null;
    createdBy: string;
  }> {
    const rows = this.getDb().prepare(`
      SELECT id, version, is_published, created_at, published_at, created_by
      FROM home_content_revisions
      ORDER BY id DESC LIMIT 20
    `).all() as any[];

    return rows.map((r) => ({
      id: r.id,
      version: r.version,
      isPublished: Boolean(r.is_published),
      createdAt: r.created_at,
      publishedAt: r.published_at,
      createdBy: r.created_by,
    }));
  }
}

