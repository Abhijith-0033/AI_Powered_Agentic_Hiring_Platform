import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pool from "./db.js";
import dotenv from "dotenv";

dotenv.config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:3000/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            const client = await pool.connect();
            try {
                const googleId = profile.id;
                const email = profile.emails[0].value;
                const name = profile.displayName;

                // 1. Check by google_id
                const googleUser = await client.query(
                    "SELECT * FROM credentials WHERE google_id = $1",
                    [googleId]
                );

                if (googleUser.rows.length > 0) {
                    return done(null, googleUser.rows[0]);
                }

                // 2. Check by email (link account)
                const emailUser = await client.query(
                    "SELECT * FROM credentials WHERE email = $1",
                    [email]
                );

                if (emailUser.rows.length > 0) {
                    const user = emailUser.rows[0];
                    await client.query(
                        "UPDATE credentials SET google_id = $1 WHERE id = $2",
                        [googleId, user.id]
                    );
                    return done(null, { ...user, google_id: googleId });
                }

                // 3. Create new user
                const newUser = await client.query(
                    `
          INSERT INTO credentials (email, name, google_id, role, is_verified, created_at)
          VALUES ($1, $2, $3, 'job_seeker', true, NOW())
          RETURNING *
          `,
                    [email, name, googleId]
                );

                return done(null, newUser.rows[0]);
            } catch (err) {
                return done(err, null);
            } finally {
                client.release();
            }
        }
    )
);

export default passport;
