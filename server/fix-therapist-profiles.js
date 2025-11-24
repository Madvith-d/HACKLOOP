// Simple script to check and fix therapist profile links
require('dotenv').config();
const db = require('./src/db');

async function checkAndFix() {
    try {
        console.log('\n=== Therapist Profile Diagnostic ===\n');

        // 1. Check if user_id column exists
        console.log('1. Checking if user_id column exists in therapists table...');
        const columnCheck = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'therapists' AND column_name = 'user_id'
        `);

        if (columnCheck.rows.length === 0) {
            console.log('   ❌ user_id column does NOT exist. Adding it now...');
            await db.query('ALTER TABLE therapists ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE');
            console.log('   ✅ user_id column added successfully!');
        } else {
            console.log('   ✅ user_id column exists');
        }

        // 2. List all therapists
        console.log('\n2. Current therapists in database:');
        const therapists = await db.query('SELECT id, name, specialty, user_id FROM therapists');
        therapists.rows.forEach((t, i) => {
            const linked = t.user_id ? `✅ Linked to user ${t.user_id}` : '❌ Not linked';
            console.log(`   ${i + 1}. ${t.name} (${t.specialty}) - ${linked}`);
        });

        // 3. List all therapist users (role = 'therapist')
        console.log('\n3. Users with therapist role:');
        const therapistUsers = await db.query('SELECT id, name, email, role FROM users WHERE role = $1', ['therapist']);

        if (therapistUsers.rows.length === 0) {
            console.log('   ❌ No users with therapist role found');
            console.log('   💡 You need to sign up as a therapist first!');
        } else {
            therapistUsers.rows.forEach((u, i) => {
                console.log(`   ${i + 1}. ${u.name} (${u.email}) - ID: ${u.id}`);
            });

            // 4. Try to auto-link first unlinked therapist to first therapist user
            const unlinkedTherapist = therapists.rows.find(t => !t.user_id);
            const firstTherapistUser = therapistUsers.rows[0];

            if (unlinkedTherapist && firstTherapistUser) {
                console.log(`\n4. Auto-linking ${firstTherapistUser.name} to ${unlinkedTherapist.name}...`);
                await db.query('UPDATE therapists SET user_id = $1 WHERE id = $2', [
                    firstTherapistUser.id,
                    unlinkedTherapist.id
                ]);
                console.log('   ✅ Successfully linked!');
            } else if (!unlinkedTherapist) {
                console.log('\n4. All therapist profiles are already linked.');
            }
        }

        console.log('\n=== Diagnostic Complete ===\n');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Run the check
checkAndFix();
