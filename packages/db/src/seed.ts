import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import { posts, media, postMedia, tags, postTags } from "./schema/membership";
import { user } from "./schema/auth";
import dotenv from "dotenv";

dotenv.config({ path: "../../apps/web/.env" });

const defaultDbPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../lukeroes.db",
);
const sqlite = new Database(process.env.DATABASE_PATH || defaultDbPath);
sqlite.pragma("journal_mode = WAL");
const db = drizzle(sqlite);

// Init FTS5
sqlite.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
    title, excerpt, content, content=posts, content_rowid=id
  );
  CREATE TRIGGER IF NOT EXISTS posts_ai AFTER INSERT ON posts BEGIN
    INSERT INTO posts_fts(rowid, title, excerpt, content)
    VALUES (new.id, new.title, new.excerpt, new.content);
  END;
  CREATE TRIGGER IF NOT EXISTS posts_au AFTER UPDATE ON posts BEGIN
    INSERT INTO posts_fts(posts_fts, rowid, title, excerpt, content)
    VALUES ('delete', old.id, old.title, old.excerpt, old.content);
    INSERT INTO posts_fts(rowid, title, excerpt, content)
    VALUES (new.id, new.title, new.excerpt, new.content);
  END;
  CREATE TRIGGER IF NOT EXISTS posts_ad AFTER DELETE ON posts BEGIN
    INSERT INTO posts_fts(posts_fts, rowid, title, excerpt, content)
    VALUES ('delete', old.id, old.title, old.excerpt, old.content);
  END;
`);

async function seed() {
  console.log("Seeding database...");

  // Clear existing data (idempotent)
  db.delete(postTags).run();
  db.delete(postMedia).run();
  db.delete(posts).run();
  db.delete(media).run();
  db.delete(tags).run();

  // Rebuild FTS index
  sqlite.exec("INSERT INTO posts_fts(posts_fts) VALUES('rebuild')");

  // Create a dedicated seed user (won't conflict with real accounts)
  const seedUserId = "seed-user";
  const [existingSeedUser] = db.select().from(user).where(eq(user.id, seedUserId)).all();
  if (!existingSeedUser) {
    db.insert(user)
      .values({
        id: seedUserId,
        name: "Seed Author",
        email: "seed@localhost",
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .run();
  }
  const authorId = seedUserId;

  // Create tags
  const tagMap = new Map<string, number>();
  const tagNames = [
    "Groundwork",
    "Music Industry",
    "Creative Process",
    "Studio",
    "Songwriting",
    "Poetry",
    "Midnight Hours",
    "Production",
    "Tour",
  ];
  for (const name of tagNames) {
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const [t] = db.insert(tags).values({ name, slug }).returning().all();
    tagMap.set(name, t.id);
  }

  // Create media entries (placeholder URLs for images and audio)
  const mediaEntries = [
    // Studio photos (post 5)
    {
      type: "image" as const,
      fileKey: "studio-console.jpg",
      url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800",
      alt: "Recording console lit up at night",
    },
    {
      type: "image" as const,
      fileKey: "vocal-booth.jpg",
      url: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800",
      alt: "Microphone in vocal booth",
    },
    {
      type: "image" as const,
      fileKey: "guitar-amp.jpg",
      url: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800",
      alt: "Guitar leaning against amplifier",
    },
    {
      type: "image" as const,
      fileKey: "studio-monitors.jpg",
      url: "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800",
      alt: "Studio monitors and desk",
    },
    // Handwritten lyrics (post 10)
    {
      type: "image" as const,
      fileKey: "handwritten-lyrics.jpg",
      url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800",
      alt: "Handwritten lyrics in a notebook",
    },
    // Tour photos (post 14)
    {
      type: "image" as const,
      fileKey: "stage-view.jpg",
      url: "https://images.unsplash.com/photo-1501386761578-0a55d4e96632?w=800",
      alt: "Stage from performer's perspective",
    },
    {
      type: "image" as const,
      fileKey: "crowd.jpg",
      url: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800",
      alt: "Crowd at a small venue",
    },
    {
      type: "image" as const,
      fileKey: "loading-gear.jpg",
      url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
      alt: "Loading gear into the van",
    },
  ];

  const mediaIds = new Map<string, number>();
  for (const entry of mediaEntries) {
    const [m] = db
      .insert(media)
      .values({
        type: entry.type,
        fileKey: entry.fileKey,
        url: entry.url,
        alt: entry.alt,
      })
      .returning()
      .all();
    mediaIds.set(entry.fileKey, m.id);
  }

  // Create posts
  const seedPosts = [
    {
      slug: "late-night-voice-memo-march",
      type: "audio" as const,
      visibility: "members" as const,
      title: "Late Night Voice Memo — New Song Idea",
      content:
        "Couldn't sleep. This melody kept circling. Recorded it on my phone before it disappeared. Rough as hell but there's something here — maybe the start of the next single. Let me know what you think.",
      label: "voice-memo" as const,
      publishedAt: "2026-03-25T23:14:00Z",
      tags: ["Groundwork"],
    },
    {
      slug: "why-i-stopped-pitching-playlists",
      type: "writing" as const,
      visibility: "public" as const,
      format: "essay" as const,
      title: "Why I Stopped Pitching Playlists",
      excerpt:
        "For two years I spent more time writing emails to playlist curators than writing songs. Here's what changed.",
      content: `For two years I spent more time writing emails to playlist curators than writing songs. Here's what changed.

It started innocently enough — a friend got placed on a big Spotify editorial playlist and saw 50,000 streams in a week. I thought that was the game. So I started pitching. Every release, I'd spend days crafting the perfect pitch, researching curators, following up.

The math never worked. I'd spend 20 hours pitching to get maybe 2-3 placements on playlists with a few hundred followers. The streams were nice but they didn't convert to anything — no followers, no saves, no one showing up to shows.

Meanwhile I wasn't writing. The creative well was drying up because all my energy was going into marketing a catalog that was getting stale.

The turning point was when I released a song with zero pitching — just put it out, told my mailing list, posted it once on Instagram. It got fewer streams in the first week but more saves, more shares, more people actually talking about it. Because it was a better song. Because I'd spent those 20 hours writing instead of pitching.

I'm not saying playlists are bad. I'm saying the time trade-off was destroying my creative output, and for an independent artist, the music IS the marketing. If the songs are good enough, people share them. If they're not, no playlist placement is going to build you a real audience.

Now I spend that time here — writing to you, sharing demos, working on the craft. It feels a lot more honest.`,
      readingTime: "4 min read",
      publishedAt: "2026-03-23T10:00:00Z",
      tags: ["Music Industry", "Creative Process"],
    },
    {
      slug: "studio-notebook-entry",
      type: "note" as const,
      visibility: "members" as const,
      content:
        "Been in the studio all week. Something special is coming together — a song I've been sitting on for over a year finally found its arrangement. Can't wait to share the first demo with you all.",
      publishedAt: "2026-03-22T16:30:00Z",
      tags: ["Studio"],
    },
    {
      slug: "groundwork-early-demo",
      type: "audio" as const,
      visibility: "members" as const,
      title: "Early Demo — 'Groundwork'",
      content:
        "This is the stripped-back version before we went into full production. Just acoustic guitar and vocal, recorded in one take. Compare this to the final version when it comes out next month — it's wild how much a song can change.",
      label: "demo" as const,
      publishedAt: "2026-03-20T14:00:00Z",
      tags: ["Groundwork"],
    },
    {
      slug: "studio-shots-march",
      type: "photo" as const,
      visibility: "members" as const,
      excerpt: "A few shots from this week's sessions. The console at 2am hits different.",
      publishedAt: "2026-03-19T11:00:00Z",
      tags: ["Studio", "Groundwork"],
      photos: ["studio-console.jpg", "vocal-booth.jpg", "guitar-amp.jpg", "studio-monitors.jpg"],
    },
    {
      slug: "old-notebook-lyrics",
      type: "note" as const,
      visibility: "members" as const,
      content:
        "Found this old notebook from 2019 with lyrics I completely forgot about. One of them might become the next single. It's funny how sometimes the best ideas are the ones you abandon and come back to years later with fresh ears.",
      publishedAt: "2026-03-18T09:15:00Z",
      tags: ["Songwriting"],
    },
    {
      slug: "small-hours",
      type: "writing" as const,
      visibility: "members" as const,
      format: "poetry" as const,
      title: "Small Hours",
      excerpt:
        "A poem about the space between midnight and dawn where all the honest writing happens.",
      content: `The house settles into its own bones
and the fridge hums a single note
that I mistake, sometimes, for singing.

This is the hour when the pen
doesn't ask permission —
it just moves, like water
finding the lowest point.

I used to fight it.
Set alarms for six,
made coffee like a responsible person,
sat at the desk with the light on.

Nothing came.

But here — bare feet on cold tile,
notebook balanced on one knee,
the dog asleep on the other —
here is where the songs start.

Not as melodies. As confessions.
Small truths I wouldn't say out loud
in any room with overhead lighting.

Tomorrow I'll shape them.
Tonight I just listen.`,
      readingTime: "1 min read",
      publishedAt: "2026-03-16T22:00:00Z",
      tags: ["Poetry"],
    },
    {
      slug: "making-of-midnight-hours",
      type: "writing" as const,
      visibility: "members" as const,
      format: "essay" as const,
      title: "The Making of 'Midnight Hours'",
      excerpt:
        "The full story behind the song — from the 3am voice memo that started it to the final master. Including the version we almost released instead.",
      content: `The full story behind the song — from the 3am voice memo that started it to the final master. Including the version we almost released instead.

Midnight Hours started as most of my songs do: a voice memo recorded half-asleep. I was up late after a show in Montreal, sitting in the hotel bathroom so I wouldn't wake up my bandmate. I hummed the chorus melody into my phone and went to sleep.

The next morning I almost deleted it. It sounded thin and mumbled. But there was this one interval jump in the melody — going from the low note to the high note on "hours" — that I couldn't stop singing.

I brought it to the studio a week later. The first full version was completely different from what you've heard. It was uptempo, almost a rock song. We tracked live drums, crunchy guitars, the whole thing. It sounded... fine. Professional. But it didn't feel like that 3am moment in the bathroom.

So we stripped it all away. Started over with just a piano. And suddenly the song came alive. The space around the vocal let the melody breathe. That interval jump that hooked me in the first place became the emotional peak of the whole track.

The lesson I keep learning: the first idea is usually right. Everything you add after that needs to earn its place.

I saved the rock version. Maybe I'll share it here sometime so you can hear the difference. It's a good reminder that production choices aren't just technical — they're emotional.`,
      readingTime: "5 min read",
      publishedAt: "2026-03-15T11:00:00Z",
      tags: ["Midnight Hours", "Production", "Creative Process"],
    },
    {
      slug: "bridge-session-clip",
      type: "audio" as const,
      visibility: "members" as const,
      title: "Studio Session — Working on the Bridge",
      content:
        "A clip from yesterday's session. We were stuck on the bridge for this new song — tried about six different approaches. This is the one that finally clicked. You can hear us figuring it out in real time.",
      label: "studio-session" as const,
      publishedAt: "2026-03-12T19:45:00Z",
      tags: ["Studio", "Groundwork"],
    },
    {
      slug: "handwritten-lyrics-photo",
      type: "photo" as const,
      visibility: "members" as const,
      excerpt: "First draft of the new one. The crossed-out lines are usually the best part.",
      publishedAt: "2026-03-11T15:00:00Z",
      tags: ["Songwriting"],
      photos: ["handwritten-lyrics.jpg"],
    },
    {
      slug: "question-for-members",
      type: "note" as const,
      visibility: "public" as const,
      content:
        "Question for you — would you rather hear the acoustic demos or the full production versions first when I'm working on new music? I've been going back and forth on this. The demos feel more intimate but the productions are more exciting. What do you think?",
      publishedAt: "2026-03-10T12:00:00Z",
      tags: [],
    },
    {
      slug: "what-i-learned-100-shows",
      type: "writing" as const,
      visibility: "members" as const,
      format: "essay" as const,
      title: "What I Learned From 100 Shows",
      excerpt:
        "Last month I played my 100th live show. Here are the things nobody tells you about performing — the mistakes, the breakthroughs, and why I almost quit after show #34.",
      content: `Last month I played my 100th live show. Here are the things nobody tells you about performing — the mistakes, the breakthroughs, and why I almost quit after show #34.

Show #1 was at a coffee shop in my hometown. I played to 8 people, 5 of whom were family. I forgot the words to my own song and played the wrong chord for an entire verse. Somehow, someone in the audience came up after and said it was the best thing they'd seen all week. I think they were being kind, but it kept me going.

By show #20 I had a system. I'd practiced my setlist until it was bulletproof. I could play every song in my sleep. And that was the problem — I was playing them in my sleep. Going through the motions. The audience could feel it.

Show #34 was the breaking point. A Tuesday night in a half-empty bar. The sound was terrible. Nobody was listening. I was three songs in and I thought: why am I doing this? I could be home writing new music instead of playing to people who don't care.

I finished the set and drove home seriously considering quitting live performance altogether. But something happened at show #35 that changed everything.

A woman in the front row was crying during the second song. Not dramatically — just quietly, tears on her face. After the set she told me the song reminded her of her late husband. She'd driven two hours to see me because she'd found the song on Spotify six months after he died.

That's when I understood. You're not playing to a room. You're playing to each person in the room. And you never know which one needs to hear it.

The next 65 shows were different. I stopped trying to perform and started trying to connect. I'd look people in the eye. I'd tell stories between songs — real ones, not rehearsed banter. I'd play requests. I'd mess up and laugh about it.

The technical stuff matters less than I thought. The emotional stuff matters more than I could have imagined.`,
      readingTime: "8 min read",
      publishedAt: "2026-03-06T10:00:00Z",
      tags: ["Tour", "Creative Process"],
    },
    {
      slug: "phone-memo-harmony-idea",
      type: "audio" as const,
      visibility: "members" as const,
      title: "Phone Memo — Harmony Idea",
      content:
        "Walking home from dinner and this harmony part hit me. Recorded it on the sidewalk — you can hear the traffic in the background. Sometimes the best ideas come when you're not trying.",
      label: "voice-memo" as const,
      publishedAt: "2026-03-03T22:30:00Z",
      tags: ["Songwriting"],
    },
    {
      slug: "tour-snapshots-february",
      type: "photo" as const,
      visibility: "public" as const,
      excerpt:
        "A few highlights from the February run. Hamilton → Ottawa → Montreal → Quebec City.",
      publishedAt: "2026-02-28T18:00:00Z",
      tags: ["Tour"],
      photos: ["stage-view.jpg", "crowd.jpg", "loading-gear.jpg"],
    },
  ];

  for (const postData of seedPosts) {
    const {
      tags: postTagNames,
      photos,
      ...postValues
    } = postData as typeof postData & { photos?: string[] };

    const [p] = db
      .insert(posts)
      .values({
        ...postValues,
        authorId,
        readingTime: (postValues as { readingTime?: string }).readingTime ?? null,
        format: (postValues as { format?: string }).format ?? null,
        label: (postValues as { label?: string }).label ?? null,
      })
      .returning()
      .all();

    // Attach tags
    if (postTagNames && postTagNames.length > 0) {
      for (const tagName of postTagNames) {
        const tagId = tagMap.get(tagName);
        if (tagId) {
          db.insert(postTags).values({ postId: p.id, tagId }).run();
        }
      }
    }

    // Attach photos
    if (photos && photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        const mediaId = mediaIds.get(photos[i]);
        if (mediaId) {
          db.insert(postMedia)
            .values({ postId: p.id, mediaId, role: "photo", displayOrder: i })
            .run();
        }
      }
    }
  }

  console.log(
    `Seeded ${seedPosts.length} posts, ${tagNames.length} tags, ${mediaEntries.length} media`,
  );
  sqlite.close();
}

seed().catch(console.error);
