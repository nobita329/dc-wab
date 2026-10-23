import { DatabaseManager } from "../database/connection.js";
import { TeamPageData, TeamMember } from "@nova/shared";

const defaultTeamMembers: TeamMember[] = [
  {
    id: "123456789",
    category: "Leadership",
    name: "Nobita",
    role: "Owner",
    roleShort: "OWNER",
    desc: "Lead Developer",
    status: "dnd",
    game: "VS Code",
    color: "yellow",
    avatar: "https://i.ibb.co/Y4RWVTbY/discord-fake-avatar-decorations-1767018696456.gif",
    discordId: "123456789",
  },
  {
    id: "2233445566",
    category: "Leadership",
    name: "Miss Riya",
    role: "Co-Owner",
    roleShort: "CO-OWNER",
    desc: "SRV DB Manager",
    status: "online",
    game: "Database",
    color: "purple",
    avatar: "https://images-ext-1.discordapp.net/external/ZmGWbUSsE2_E9WD33Esb3J10IXJp25j_NXLnsygJjuE/%3Fsize%3D1024/https/cdn.discordapp.com/avatars/872153892425707600/a6f2d4795f453d725babbcd8156bf4ce.png?format=webp&quality=lossless&width=356&height=356",
    discordId: "2233445566",
  },
  {
    id: "987654321",
    category: "Development",
    name: "You",
    role: "Developer",
    roleShort: "DEVELOPER",
    desc: "Full Stack Dev",
    status: "online",
    game: "Visual Studio",
    color: "blue",
    avatar: "https://i.ibb.co/YT42zXt3/discord-fake-avatar-decorations-1767631301047.gif",
    discordId: "987654321",
  },
  {
    id: "4455667788",
    category: "Development",
    name: "Aarma",
    role: "Code Dev",
    roleShort: "CODE DEV",
    desc: "Code Developer",
    status: "dnd",
    game: "Coding",
    color: "indigo",
    avatar: "https://images-ext-1.discordapp.net/external/M_rcqoMZOdLdzssbG_3EsQrQJQKIOo4Ibwdzd6K1OZs/%3Fsize%3D4096/https/cdn.discordapp.com/avatars/1073795910645071872/a_a6aac3b9a5aae6cf41ea4c0f2bafdbad.gif?width=278&height=278",
    discordId: "4455667788",
  },
  {
    id: "3344556677",
    category: "Development",
    name: "Kabeer",
    role: "Script Host",
    roleShort: "HOST",
    desc: "Script Hosting",
    status: "idle",
    game: "Hosting",
    color: "orange",
    avatar: "https://images-ext-1.discordapp.net/external/ISfYn9ifwzCy45cTLRx7EAJmcAuR4DnBwk7Kx0FhaOE/%3Fsize%3D256/https/cdn.discordapp.com/avatars/1327154284965396543/d40ccbe89c54f74764e57edc0cc6cb50.png?format=webp&quality=lossless&width=176&height=176",
    discordId: "3344556677",
  },
  {
    id: "1122334455",
    category: "Development",
    name: "Deadishere",
    role: "Minecraft Dev",
    roleShort: "MC DEV",
    desc: "Minecraft Developer",
    status: "online",
    game: "Minecraft",
    color: "green",
    avatar: "https://media.discordapp.net/attachments/1454865252226306168/1463244170830418106/Cropped_Image.png?ex=69711fd4&is=696fce54&hm=349467620720638b8fb57d105385eb5cba4b11de62c84125ca6fa9dbb22402e3&=&format=webp&quality=lossless&width=580&height=579",
    discordId: "1122334455",
  },
  {
    id: "5566778899",
    category: "Development",
    name: "Shadow",
    role: "Backend Dev",
    roleShort: "BACKEND",
    desc: "API & Backend Development",
    status: "online",
    game: "Terminal",
    color: "cyan",
    avatar: "https://cdn.discordapp.com/embed/avatars/1.png",
    discordId: "5566778899",
  },
  {
    id: "6677889900",
    category: "Development",
    name: "Luna",
    role: "Frontend Dev",
    roleShort: "FRONTEND",
    desc: "UI/UX & Frontend Development",
    status: "idle",
    game: "Figma",
    color: "pink",
    avatar: "https://cdn.discordapp.com/embed/avatars/2.png",
    discordId: "6677889900",
  },
  {
    id: "7788990011",
    category: "Moderation & Support",
    name: "Zen",
    role: "Server Moderator",
    roleShort: "MOD",
    desc: "Community Moderation",
    status: "online",
    game: "Discord",
    color: "teal",
    avatar: "https://cdn.discordapp.com/embed/avatars/3.png",
    discordId: "7788990011",
  },
  {
    id: "8899001122",
    category: "Moderation & Support",
    name: "Max",
    role: "Support Agent",
    roleShort: "SUPPORT",
    desc: "Member Support",
    status: "online",
    game: "Ticket System",
    color: "emerald",
    avatar: "https://cdn.discordapp.com/embed/avatars/4.png",
    discordId: "8899001122",
  },
  {
    id: "9900112233",
    category: "Moderation & Support",
    name: "Nova",
    role: "Community Manager",
    roleShort: "CM",
    desc: "Community Engagement",
    status: "idle",
    game: "Social Media",
    color: "violet",
    avatar: "https://cdn.discordapp.com/embed/avatars/5.png",
    discordId: "9900112233",
  },
  {
    id: "0011223344",
    category: "Moderation & Support",
    name: "Rex",
    role: "Security Lead",
    roleShort: "SECURITY",
    desc: "Server Security",
    status: "dnd",
    game: "Security Audit",
    color: "red",
    avatar: "https://cdn.discordapp.com/embed/avatars/0.png",
    discordId: "0011223344",
  },
];

export class TeamRepository {
  private getDb() {
    return DatabaseManager.getInstance().getConnection("team");
  }

  private ensureInitialized() {
    const db = this.getDb();
    const settingsCountRow = db.prepare("SELECT count(*) as count FROM team_settings").get() as { count: number };
    const memberCountRow = db.prepare("SELECT count(*) as count FROM team_members").get() as { count: number };
    const now = new Date().toISOString();

    if (settingsCountRow.count === 0) {
      db.prepare(`
        INSERT INTO team_settings (id, title, badge, subtitle, discord_server_id, updated_at, updated_by)
        VALUES ('main', ?, ?, ?, '1540761150797389915', ?, 'system')
      `).run(
        "Meet Our Team",
        "THE MINDS BEHIND NOVA & NOBITA CLOUD",
        "A collective of visionary leaders, full-stack developers, infrastructure specialists, and community architects shaping next-generation digital experiences.",
        now
      );
    }

    if (memberCountRow.count === 0) {
      const insertStmt = db.prepare(`
        INSERT INTO team_members (id, name, category, role, role_short, desc, status, game, color, avatar, discord_id, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (let i = 0; i < defaultTeamMembers.length; i++) {
        const m = defaultTeamMembers[i];
        insertStmt.run(
          m.id,
          m.name,
          m.category,
          m.role,
          m.roleShort,
          m.desc,
          m.status,
          m.game || null,
          m.color,
          m.avatar,
          m.discordId || null,
          i,
          now,
          now
        );
      }
    }
  }

  public getTeamData(): TeamPageData {
    this.ensureInitialized();
    const db = this.getDb();

    const settings = db.prepare("SELECT * FROM team_settings WHERE id = 'main'").get() as
      | { title: string; badge: string; subtitle: string; discord_server_id: string }
      | undefined;

    const rows = db.prepare(`
      SELECT id, name, category, role, role_short as roleShort, desc, status, game, color, avatar, discord_id as discordId, sort_order
      FROM team_members
      ORDER BY sort_order ASC, created_at ASC
    `).all() as any[];

    const members: TeamMember[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      role: r.role,
      roleShort: r.roleShort,
      desc: r.desc,
      status: r.status,
      game: r.game || undefined,
      color: r.color,
      avatar: r.avatar,
      discordId: r.discordId || undefined,
    }));

    const categories = Array.from(new Set(members.map((m) => m.category)));
    if (!categories.includes("Leadership")) categories.unshift("Leadership");
    if (!categories.includes("Development")) categories.push("Development");
    if (!categories.includes("Moderation & Support")) categories.push("Moderation & Support");

    return {
      title: settings?.title || "Meet Our Team",
      badge: settings?.badge || "THE MINDS BEHIND NOVA & NOBITA CLOUD",
      subtitle:
        settings?.subtitle ||
        "A collective of visionary leaders, full-stack developers, infrastructure specialists, and community architects shaping next-generation digital experiences.",
      stats: [
        { label: "Core Members", value: String(members.length), description: "Specialized roles" },
        { label: "Departments", value: String(categories.length), description: "Leadership & Ops" },
        { label: "Uptime & Quality", value: "99.9%", description: "Verified SLA" },
        { label: "Community Support", value: "24/7", description: "Discord & Live" },
      ],
      categories,
      members,
    };
  }

  public saveTeamData(data: TeamPageData, updatedBy: string): TeamPageData {
    this.ensureInitialized();
    const db = this.getDb();
    const now = new Date().toISOString();

    db.exec("BEGIN TRANSACTION");
    try {
      // Update settings
      db.prepare(`
        UPDATE team_settings
        SET title = ?, badge = ?, subtitle = ?, updated_at = ?, updated_by = ?
        WHERE id = 'main'
      `).run(data.title, data.badge, data.subtitle, now, updatedBy);

      // Re-populate members
      db.exec("DELETE FROM team_members");
      const insertStmt = db.prepare(`
        INSERT INTO team_members (id, name, category, role, role_short, desc, status, game, color, avatar, discord_id, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (let i = 0; i < data.members.length; i++) {
        const m = data.members[i];
        insertStmt.run(
          m.id || `member-${Date.now()}-${i}`,
          m.name,
          m.category,
          m.role,
          m.roleShort,
          m.desc,
          m.status,
          m.game || null,
          m.color,
          m.avatar,
          m.discordId || null,
          i,
          now,
          now
        );
      }

      db.exec("COMMIT");
      return this.getTeamData();
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  }

  public addOrUpdateMember(member: TeamMember, updatedBy: string): TeamMember {
    this.ensureInitialized();
    const db = this.getDb();
    const now = new Date().toISOString();

    const existing = db.prepare("SELECT id FROM team_members WHERE id = ?").get(member.id) as { id: string } | undefined;

    if (existing) {
      db.prepare(`
        UPDATE team_members
        SET name = ?, category = ?, role = ?, role_short = ?, desc = ?, status = ?, game = ?, color = ?, avatar = ?, discord_id = ?, updated_at = ?
        WHERE id = ?
      `).run(
        member.name,
        member.category,
        member.role,
        member.roleShort,
        member.desc,
        member.status,
        member.game || null,
        member.color,
        member.avatar,
        member.discordId || null,
        now,
        member.id
      );
    } else {
      const maxOrderRow = db.prepare("SELECT max(sort_order) as maxOrder FROM team_members").get() as { maxOrder: number | null };
      const nextOrder = (maxOrderRow?.maxOrder ?? -1) + 1;

      db.prepare(`
        INSERT INTO team_members (id, name, category, role, role_short, desc, status, game, color, avatar, discord_id, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        member.id,
        member.name,
        member.category,
        member.role,
        member.roleShort,
        member.desc,
        member.status,
        member.game || null,
        member.color,
        member.avatar,
        member.discordId || null,
        nextOrder,
        now,
        now
      );
    }

    return member;
  }

  public deleteMember(memberId: string): boolean {
    this.ensureInitialized();
    const db = this.getDb();
    const res = db.prepare("DELETE FROM team_members WHERE id = ?").run(memberId);
    return res.changes > 0;
  }
}
