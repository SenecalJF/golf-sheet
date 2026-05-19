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
  const existing = await prisma.course.count();
  if (existing >= COURSES.length) {
    console.log(`Skipping seed — ${existing} courses already present.`);
    return;
  }
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
  console.log(`Seeded ${COURSES.length} courses.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
