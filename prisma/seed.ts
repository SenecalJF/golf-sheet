import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const COURSES: { name: string; city: string }[] = [
  // Montreal / South Shore / North Shore
  { name: "Le Mirage", city: "Terrebonne" },
  { name: "Club de golf Saint-Raphaël", city: "Île-Bizard" },
  { name: "Golf Saint-Lazare", city: "Saint-Lazare" },
  { name: "Falcon Golf Club", city: "Hudson" },
  { name: "Elm Ridge Country Club", city: "Île-Bizard" },
  { name: "Golf Métropolitain Anjou", city: "Anjou" },
  { name: "Meadowbrook Golf Club", city: "Côte-Saint-Luc" },
  { name: "Beaconsfield Golf Club", city: "Pointe-Claire" },
  { name: "Hillsdale Golf & Country Club", city: "Mirabel" },
  { name: "Club de golf Atlantide", city: "Brossard" },
  { name: "Club de golf de Verchères", city: "Verchères" },
  { name: "Pinegrove Country Club", city: "Saint-Jean-sur-Richelieu" },
  { name: "Club de golf Saint-Jean", city: "Saint-Jean-sur-Richelieu" },
  { name: "Club de golf Candiac", city: "Candiac" },
  { name: "Golf Le Versant", city: "Terrebonne" },
  { name: "Club de golf Glendale", city: "Mirabel" },
  { name: "Golf Islesmere", city: "Laval" },
  { name: "Club de golf Bellevue", city: "Léry" },
  { name: "Club de golf Le Cardinal", city: "Laval" },
  { name: "Club de golf de l'Île de Boucherville", city: "Boucherville" },
  { name: "Club de golf de Saint-Lambert", city: "Saint-Lambert" },
  { name: "Club de golf Dorval", city: "Dorval" },
  { name: "Royal Montreal Golf Club", city: "Île-Bizard" },
  { name: "Country Club de Montréal", city: "Saint-Lambert" },
  { name: "Club de golf Laval-sur-le-Lac", city: "Laval" },
  { name: "Club de golf Mont-Bruno", city: "Saint-Bruno-de-Montarville" },
  { name: "Club de golf de la Vallée-du-Richelieu", city: "Sainte-Julie" },
  { name: "Le Blainvillier", city: "Blainville" },
  { name: "Club de golf Quatre-Domaines", city: "Mirabel" },
  { name: "Club de golf de Saint-Hyacinthe", city: "Saint-Hyacinthe" },

  // Laurentides / Mont-Tremblant
  { name: "Le Diable", city: "Mont-Tremblant" },
  { name: "Le Géant", city: "Mont-Tremblant" },
  { name: "Le Maître de Mont-Tremblant", city: "Mont-Tremblant" },
  { name: "Gray Rocks", city: "Mont-Tremblant" },
  { name: "Royal Laurentien", city: "Saint-Faustin-Lac-Carré" },
  { name: "La Bête de Tremblant", city: "Mont-Tremblant" },

  // Cantons-de-l'Est / Estrie
  { name: "Royal Bromont", city: "Bromont" },
  { name: "Owl's Head", city: "Mansonville" },

  // Charlevoix
  { name: "Club de golf Murray Bay", city: "La Malbaie" },
  { name: "Le Manoir Richelieu", city: "La Malbaie" },

  // Québec / Chaudière-Appalaches
  { name: "Royal Québec", city: "Boischatel" },
  { name: "Club de golf Cap-Rouge", city: "Québec" },
];

const DEFAULT_PARS = "4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4";

async function main() {
  for (const c of COURSES) {
    const course = await prisma.course.upsert({
      where: { name: c.name },
      update: { city: c.city },
      create: {
        name: c.name,
        city: c.city,
        province: "QC",
        country: "Canada",
      },
    });

    await prisma.tee.upsert({
      where: { courseId_name: { courseId: course.id, name: "White" } },
      update: {},
      create: {
        courseId: course.id,
        name: "White",
        color: "#ffffff",
        pars: DEFAULT_PARS,
        holeCount: 18,
      },
    });
  }

  await seedTitsOpen();

  console.log(`Seeded ${COURSES.length} courses and Tits Open tournament data.`);
}

const TITS_OPEN_ASSET_BASE = "/tournaments/tits-open/2026";

type TitsOpenSeedPlayer = {
  slug: string;
  displayName: string;
  nickname: string;
  bio: string;
  image: string;
  handicapSnapshot: number;
  individualWins: number;
  teamWins: number;
  displayOrder: number;
  role?: "PLAYER" | "CADDIE" | "GUEST";
};

type TitsOpenSeedParticipant = {
  id: string;
  role: "PLAYER" | "CADDIE" | "GUEST";
};

const TITS_OPEN_PLAYERS: TitsOpenSeedPlayer[] = [
  {
    slug: "jean-francois-senecal",
    displayName: "Jean-Francois Senecal",
    nickname: "Jean-Bois de la Quille",
    bio: "A reliable presence in any foursome, built for match play and late-round pressure.",
    image: `${TITS_OPEN_ASSET_BASE}/players/jean-francois-senecal.webp`,
    handicapSnapshot: 8,
    individualWins: 0,
    teamWins: 0,
    displayOrder: 1,
  },
  {
    slug: "nicolas-lopez",
    displayName: "Nicolas Lopez",
    nickname: "Tiki",
    bio: "A composed player who keeps the round moving and waits patiently for everyone else to make mistakes.",
    image: `${TITS_OPEN_ASSET_BASE}/players/nicolas-lopez.webp`,
    handicapSnapshot: 4,
    individualWins: 0,
    teamWins: 0,
    displayOrder: 2,
  },
  {
    slug: "simon-denis",
    displayName: "Simon Denis",
    nickname: "Shlim",
    bio: "Known for steady irons, strong mental game, and unmatched confidence on the first tee.",
    image: `${TITS_OPEN_ASSET_BASE}/players/simon-denis.webp`,
    handicapSnapshot: 2,
    individualWins: 1,
    teamWins: 1,
    displayOrder: 3,
  },
  {
    slug: "thomas-villeneuve",
    displayName: "Thomas Villeneuve",
    nickname: "Mr. Beret",
    bio: "A powerful ball striker with high expectations and occasional questionable decisions on the green.",
    image: `${TITS_OPEN_ASSET_BASE}/players/thomas-villeneuve.webp`,
    handicapSnapshot: 0,
    individualWins: 0,
    teamWins: 1,
    displayOrder: 4,
  },
  {
    slug: "alexis-desforges",
    displayName: "Alexis Desforges",
    nickname: "Piment",
    bio: "A steady presence with sharp course reads and questionable confidence in club selection.",
    image: `${TITS_OPEN_ASSET_BASE}/players/alexis-desforges.webp`,
    handicapSnapshot: 12,
    individualWins: 0,
    teamWins: 1,
    displayOrder: 5,
  },
  {
    slug: "jonathan-roy-ascanio",
    displayName: "Jonathan Roy Ascanio",
    nickname: "Mario",
    bio: "A fearless shot maker with a high ceiling, a dangerous putter, and selective course management.",
    image: `${TITS_OPEN_ASSET_BASE}/players/jonathan-roy-ascanio.webp`,
    handicapSnapshot: 6,
    individualWins: 0,
    teamWins: 0,
    displayOrder: 6,
  },
  {
    slug: "christophe-lapointe",
    displayName: "Christophe Lapointe",
    nickname: "Desire",
    bio: "A tactical player who knows when to play safe, when to attack, and when to blame the wind.",
    image: `${TITS_OPEN_ASSET_BASE}/players/christophe-lapointe.webp`,
    handicapSnapshot: 10,
    individualWins: 0,
    teamWins: 0,
    displayOrder: 7,
  },
];

const TITS_OPEN_TEAMS = [
  {
    name: "Team 1",
    description:
      "Thomas and Simon carry the historic team-win pedigree into the weekend: power, confidence, and a proven Tits Open record.",
    logoImage: `${TITS_OPEN_ASSET_BASE}/teams/team1.webp`,
    members: ["thomas-villeneuve", "simon-denis"],
  },
  {
    name: "Team 2",
    description:
      "Jonathan and JF pair a fearless shot maker with a reliable match-play presence.",
    logoImage: `${TITS_OPEN_ASSET_BASE}/teams/team2.webp`,
    members: ["jonathan-roy-ascanio", "jean-francois-senecal"],
  },
  {
    name: "Team 3",
    description:
      "Christophe and Nicolas bring the patient, tactical side of the field into one pairing.",
    logoImage: `${TITS_OPEN_ASSET_BASE}/teams/team3.webp`,
    members: ["christophe-lapointe", "nicolas-lopez"],
  },
];

const TITS_OPEN_SCHEDULE = [
  {
    dayLabel: "Friday",
    timeLabel: "Evening",
    title: "Arrival",
    details: "Everyone gets in Friday evening and the weekend officially starts.",
  },
  {
    dayLabel: "Friday",
    timeLabel: "Dinner",
    title: "Champion's dinner",
    details: "Simon, last year's champion, presents the dinner.",
  },
  {
    dayLabel: "Friday",
    timeLabel: "Late",
    title: "Party all night",
    details: "No easing into it. Friday night is for the full send.",
  },
  {
    dayLabel: "Saturday",
    timeLabel: "10h10",
    title: "Tee off",
    details: "Saturday's round starts at 10h10.",
  },
  {
    dayLabel: "Saturday",
    timeLabel: "After golf",
    title: "Mario Chug",
    details: "Post-round Mario Chug before the rest of the night gets louder.",
  },
  {
    dayLabel: "Saturday",
    timeLabel: "After Mario Chug",
    title: "Beer dart",
    details: "Keep the competition going with beer dart.",
  },
  {
    dayLabel: "Saturday",
    timeLabel: "Late hours",
    title: "Casino Mont-Tremblant",
    details: "Casino stop for the late-night window.",
  },
  {
    dayLabel: "Saturday",
    timeLabel: "Night",
    title: "Ptit Caribou bar",
    details: "Close out Saturday night at Ptit Caribou bar.",
  },
  {
    dayLabel: "Sunday",
    timeLabel: "12h10",
    title: "Tee off",
    details: "Sunday's round starts at 12h10.",
  },
  {
    dayLabel: "Sunday",
    timeLabel: "After golf",
    title: "Trophy closing ceremony",
    details: "Wrap the weekend with the trophy presentation and closing ceremony.",
  },
];

async function seedTitsOpen() {
  const series = await prisma.tournamentSeries.upsert({
    where: { slug: "tits-open" },
    update: {
      name: "Tits Open",
      description: "Yearly friend tournament inside Golf Clubhouse.",
    },
    create: {
      slug: "tits-open",
      name: "Tits Open",
      description: "Yearly friend tournament inside Golf Clubhouse.",
    },
  });

  const edition2026 = await prisma.tournamentEdition.upsert({
    where: { seriesId_year: { seriesId: series.id, year: 2026 } },
    update: {
      title: "Tits Open 2026",
      subtitle: "Le tournoi de golf où ça s'joue pas juste sur dix-huit trous.",
      location: "Mont-Tremblant, QC",
      status: "PLANNED",
      layoutKey: "tits-open-2026",
      heroImage: `${TITS_OPEN_ASSET_BASE}/home/hero.webp`,
      logoImage: `${TITS_OPEN_ASSET_BASE}/home/logo.webp`,
      accentColor: "#c9a227",
      config: titsOpen2026Config(),
    },
    create: {
      seriesId: series.id,
      year: 2026,
      title: "Tits Open 2026",
      subtitle: "Le tournoi de golf où ça s'joue pas juste sur dix-huit trous.",
      location: "Mont-Tremblant, QC",
      status: "PLANNED",
      layoutKey: "tits-open-2026",
      heroImage: `${TITS_OPEN_ASSET_BASE}/home/hero.webp`,
      logoImage: `${TITS_OPEN_ASSET_BASE}/home/logo.webp`,
      accentColor: "#c9a227",
      config: titsOpen2026Config(),
    },
  });

  const edition2025 = await prisma.tournamentEdition.upsert({
    where: { seriesId_year: { seriesId: series.id, year: 2025 } },
    update: {
      title: "Tits Open 2025",
      subtitle: "Archive shell waiting for scores, photos, and stories.",
      location: "Quebec",
      status: "ARCHIVED",
      layoutKey: "tits-open-2025-empty",
      config: {
        archiveNote:
          "The 2025 page is ready to be filled with the original course, teams, scores, and photos.",
      },
    },
    create: {
      seriesId: series.id,
      year: 2025,
      title: "Tits Open 2025",
      subtitle: "Archive shell waiting for scores, photos, and stories.",
      location: "Quebec",
      status: "ARCHIVED",
      layoutKey: "tits-open-2025-empty",
      config: {
        archiveNote:
          "The 2025 page is ready to be filled with the original course, teams, scores, and photos.",
      },
    },
  });

  await seedTitsOpenCourses(edition2026.id);
  const participants = await seedTitsOpenParticipants(edition2026.id);
  await seedTitsOpenTeams(edition2026.id, participants);
  await seedTitsOpenSchedule(edition2026.id);
  await seedTitsOpenHonors(series.id, edition2025.id);
}

async function seedTitsOpenCourses(editionId: string) {
  const courses = await prisma.course.findMany({
    where: { name: { in: ["Le Diable", "Le Géant"] } },
    include: { tees: { orderBy: { name: "asc" } } },
  });
  const byName = new Map(courses.map((course) => [course.name, course]));
  const entries = [
    { courseName: "Le Diable", roundNumber: 1, dayLabel: "Saturday" },
    { courseName: "Le Géant", roundNumber: 2, dayLabel: "Sunday" },
  ];

  for (const entry of entries) {
    const course = byName.get(entry.courseName);
    if (!course) continue;
    await prisma.tournamentEditionCourse.upsert({
      where: {
        editionId_roundNumber: {
          editionId,
          roundNumber: entry.roundNumber,
        },
      },
      update: {
        courseId: course.id,
        teeId: course.tees[0]?.id ?? null,
        dayLabel: entry.dayLabel,
        holeCount: 18,
      },
      create: {
        editionId,
        courseId: course.id,
        teeId: course.tees[0]?.id ?? null,
        roundNumber: entry.roundNumber,
        dayLabel: entry.dayLabel,
        holeCount: 18,
      },
    });
  }
}

async function seedTitsOpenParticipants(editionId: string) {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true },
  });
  const usersByName = new Map(users.map((user) => [normalizeName(user.name), user.id]));
  const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const initialAdminId = initialAdminEmail
    ? users.find((user) => user.email.toLowerCase() === initialAdminEmail)?.id
    : null;
  const participants = new Map<string, TitsOpenSeedParticipant>();

  for (const player of TITS_OPEN_PLAYERS) {
    const initialUserId =
      player.slug === "jean-francois-senecal"
        ? initialAdminId ?? usersByName.get(normalizeName(player.displayName)) ?? null
        : usersByName.get(normalizeName(player.displayName)) ?? null;
    const participant = await prisma.tournamentParticipant.upsert({
      where: { editionId_slug: { editionId, slug: player.slug } },
      update: {
        displayName: player.displayName,
        nickname: player.nickname,
        country: "Canada",
        bio: player.bio,
        image: player.image,
        handicapSnapshot: player.handicapSnapshot,
        individualWins: player.individualWins,
        teamWins: player.teamWins,
        displayOrder: player.displayOrder,
      },
      create: {
        editionId,
        userId: initialUserId,
        displayName: player.displayName,
        slug: player.slug,
        nickname: player.nickname,
        country: "Canada",
        bio: player.bio,
        role: player.role ?? "PLAYER",
        image: player.image,
        handicapSnapshot: player.handicapSnapshot,
        individualWins: player.individualWins,
        teamWins: player.teamWins,
        displayOrder: player.displayOrder,
      },
    });
    participants.set(player.slug, { id: participant.id, role: participant.role });
  }

  return participants;
}

async function seedTitsOpenTeams(
  editionId: string,
  participants: Map<string, TitsOpenSeedParticipant>,
) {
  await prisma.tournamentTeamMember.deleteMany({
    where: { team: { editionId } },
  });

  for (const [index, team] of TITS_OPEN_TEAMS.entries()) {
    const createdTeam = await prisma.tournamentTeam.upsert({
      where: { editionId_name: { editionId, name: team.name } },
      update: {
        description: team.description,
        logoImage: team.logoImage,
        logoAlt: `${team.name} logo`,
        displayOrder: index + 1,
      },
      create: {
        editionId,
        name: team.name,
        description: team.description,
        logoImage: team.logoImage,
        logoAlt: `${team.name} logo`,
        displayOrder: index + 1,
      },
    });

    for (const [memberIndex, slug] of team.members.entries()) {
      const participant = participants.get(slug);
      if (!participant || participant.role === "CADDIE") continue;
      await prisma.tournamentTeamMember.create({
        data: {
          teamId: createdTeam.id,
          participantId: participant.id,
          displayOrder: memberIndex + 1,
        },
      });
    }
  }
}

async function seedTitsOpenSchedule(editionId: string) {
  await prisma.tournamentScheduleItem.deleteMany({ where: { editionId } });
  await prisma.tournamentScheduleItem.createMany({
    data: TITS_OPEN_SCHEDULE.map((item, index) => ({
      editionId,
      ...item,
      displayOrder: index + 1,
    })),
  });
}

async function seedTitsOpenHonors(seriesId: string, edition2025Id: string) {
  await prisma.tournamentHonor.deleteMany({
    where: { seriesId, year: 2025 },
  });
  await prisma.tournamentHonor.createMany({
    data: [
      {
        seriesId,
        editionId: edition2025Id,
        year: 2025,
        type: "INDIVIDUAL_CHAMPION",
        title: "Individual champion",
        participantName: "Simon Denis",
        notes: "Legacy winner carried over from the original Tits Open app.",
        displayOrder: 1,
      },
      {
        seriesId,
        editionId: edition2025Id,
        year: 2025,
        type: "TEAM_CHAMPION",
        title: "Team champions",
        teamName: "Simon Denis + Thomas Villeneuve",
        notes:
          "Historical team win inferred from the original player win counters.",
        displayOrder: 2,
      },
    ],
  });
}

function titsOpen2026Config() {
  return {
    eyebrow: "Summer 2026",
    quote:
      "Le tournoi de golf où ça s'joue pas juste sur dix-huit trous! Think big, sti!",
    courseGuide: [
      {
        courseName: "Le Diable",
        image: `${TITS_OPEN_ASSET_BASE}/home/golf-le-diable.webp`,
        mapPrefix: `${TITS_OPEN_ASSET_BASE}/course/diable`,
        tagline: "Round 1",
        summary:
          "A bold Tremblant layout with wide visuals, red-sand waste areas, and enough trouble to make the first leaderboard interesting.",
      },
      {
        courseName: "Le Géant",
        image: `${TITS_OPEN_ASSET_BASE}/home/golf-le-geant.webp`,
        mapPrefix: `${TITS_OPEN_ASSET_BASE}/course/geant`,
        tagline: "Final round",
        summary:
          "The Sunday closer moves through the mountain terrain with elevation changes, big views, and a proper finish.",
      },
    ],
  };
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
