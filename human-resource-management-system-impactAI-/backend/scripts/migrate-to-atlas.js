/*
 * One-off data migration: local MongoDB -> MongoDB Atlas.
 *
 * Uses the project's existing `mongodb` driver (no mongodump needed).
 * BSON types (_id / ObjectId / Date) are preserved exactly.
 *
 * Idempotent: documents are upserted by _id, so re-running is safe and
 * never creates duplicates. Empty collections are skipped.
 *
 * Usage (from backend/ folder):
 *   SOURCE_URL="mongodb://127.0.0.1:27017/hrms_impactai" \
 *   TARGET_URL="mongodb+srv://USER:PASS@cluster.xxxxx.mongodb.net/hrms_impactai?retryWrites=true&w=majority" \
 *   node scripts/migrate-to-atlas.js
 *
 * SOURCE_URL defaults to the local DB if not provided.
 * TARGET_URL is required and must include the /hrms_impactai database name.
 */
const { MongoClient } = require('mongodb');

const SOURCE_URL =
  process.env.SOURCE_URL || 'mongodb://127.0.0.1:27017/hrms_impactai';
const TARGET_URL = process.env.TARGET_URL;

// Collections actually used by the app. Empty/legacy ones are ignored.
const ALLOWED = ['users', 'attendances', 'leaves', 'payrolls'];
const BATCH = 500;

async function main() {
  if (!TARGET_URL) {
    console.error('ERROR: TARGET_URL env var is required (your Atlas connection string).');
    process.exit(1);
  }

  const source = new MongoClient(SOURCE_URL, { serverSelectionTimeoutMS: 8000 });
  const target = new MongoClient(TARGET_URL, { serverSelectionTimeoutMS: 15000 });

  await source.connect();
  await target.connect();

  const srcDb = source.db();
  const dstDb = target.db();

  if (!dstDb.databaseName || dstDb.databaseName === 'test') {
    console.error(
      'ERROR: TARGET_URL has no database name. Add /hrms_impactai before the "?" in the Atlas URI.'
    );
    await source.close();
    await target.close();
    process.exit(1);
  }

  console.log(`Source DB: ${srcDb.databaseName}`);
  console.log(`Target DB: ${dstDb.databaseName} (Atlas)\n`);

  const cols = await srcDb.listCollections().toArray();
  let totalCopied = 0;

  for (const { name } of cols) {
    if (!ALLOWED.includes(name)) continue;

    const docs = await srcDb.collection(name).find({}).toArray();
    if (docs.length === 0) {
      console.log(`- ${name}: 0 docs, skipped`);
      continue;
    }

    let copied = 0;
    for (let i = 0; i < docs.length; i += BATCH) {
      const slice = docs.slice(i, i + BATCH);
      const ops = slice.map((doc) => ({
        replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true },
      }));
      const res = await dstDb.collection(name).bulkWrite(ops, { ordered: false });
      copied += res.upsertedCount + res.modifiedCount + res.matchedCount;
    }

    const targetCount = await dstDb.collection(name).countDocuments();
    totalCopied += copied;
    console.log(`- ${name}: ${docs.length} source -> ${targetCount} in Atlas (ok)`);
  }

  console.log(`\nDone. ${totalCopied} documents written to Atlas.`);
  await source.close();
  await target.close();
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
