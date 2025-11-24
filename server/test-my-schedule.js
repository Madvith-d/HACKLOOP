// Test script to call my-schedule endpoint and see the error
require('dotenv').config();
const db = require('./src/db');

async function test() {
    try {
        console.log('\n=== Testing my-schedule endpoint logic ===\n');

        // Get a therapist user
        const therapistUser = await db.query(`SELECT id, name, email FROM users WHERE role = 'therapist' LIMIT 1`);
        if (therapistUser.rows.length === 0) {
            console.log('❌ No therapist user found');
            process.exit(1);
        }

        const user = therapistUser.rows[0];
        console.log('1. Found therapist user:', user.name, user.email);
        console.log('   User ID:', user.id);

        // Get therapist profile
        const therapist = await db.query('SELECT id, name, user_id FROM therapists WHERE user_id=$1', [user.id]);
        if (therapist.rows.length === 0) {
            console.log('❌ No therapist profile linked to this user');
            process.exit(1);
        }

        console.log('2. Found therapist profile:', therapist.rows[0].name);
        console.log('   Therapist ID:', therapist.rows[0].id);

        // Try to get sessions
        console.log('\n3. Fetching sessions...');
        const sessions = await db.query(`
            SELECT s.*, u.name as patient_name, u.avatar as patient_avatar
            FROM sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.therapist_id = $1
            ORDER BY COALESCE(s.scheduled_date, CURRENT_DATE) DESC, COALESCE(s.scheduled_time, '00:00') DESC
        `, [therapist.rows[0].id]);

        console.log('   ✅ Found', sessions.rows.length, 'sessions');
        sessions.rows.forEach((s, i) => {
            console.log(`   ${i + 1}. ${s.patient_name} - ${s.scheduled_date} ${s.scheduled_time} (${s.status})`);
        });

        // Try to get bookings
        console.log('\n4. Fetching bookings...');
        const bookings = await db.query(`
            SELECT b.*, u.name as patient_name, u.avatar as patient_avatar
            FROM bookings b
            JOIN users u ON u.id = b.user_id
            WHERE b.therapist_id = $1
            ORDER BY b.date DESC, b.time DESC
        `, [therapist.rows[0].id]);

        console.log('   ✅ Found', bookings.rows.length, 'bookings');
        bookings.rows.forEach((b, i) => {
            console.log(`   ${i + 1}. ${b.patient_name} - ${b.date} ${b.time} (${b.status})`);
        });

        console.log('\n=== Test Complete ===\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('Details:', error);
        process.exit(1);
    }
}

test();
