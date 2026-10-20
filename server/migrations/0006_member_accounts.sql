-- Members sign in with Auth0 (OAuth only, docs/BACKEND.md "Logowanie"); the invitation is the
-- e-mail address. Invitation codes are no longer accepted: token_hash stays only because SQLite
-- cannot drop its NOT NULL in place, new members get a random hash nobody knows.
ALTER TABLE members ADD COLUMN email TEXT;
-- Auth0 user id (`sub`), set at the first sign-in with the invited address
ALTER TABLE members ADD COLUMN auth_sub TEXT;
CREATE UNIQUE INDEX members_email ON members (email);
CREATE UNIQUE INDEX members_auth_sub ON members (auth_sub);
