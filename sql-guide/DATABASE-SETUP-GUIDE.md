# ScholChat - Guide de creation de la base de donnees locale

## Pre-requis

- PostgreSQL 18 installe (chemin par defaut : `C:\Program Files\PostgreSQL\18\`)
- Mot de passe du superutilisateur `postgres` connu
- Les fichiers SQL du projet dans : `2025backendSchoolchat/db-init/src/main/resources/`

---

## METHODE RAPIDE : Tout en une seule commande

Ouvrir CMD en tant qu'admin et executer chaque ligne une par une (mot de passe postgres demande a chaque fois) :

```bat
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='scholchat') THEN CREATE ROLE scholchat WITH LOGIN PASSWORD 'scholchat'; END IF; END $$;"
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='scholchat_user') THEN CREATE ROLE scholchat_user WITH LOGIN PASSWORD 'StrongPassword123'; END IF; END $$;"
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "DROP DATABASE IF EXISTS scholchat; CREATE DATABASE scholchat OWNER scholchat_user;"
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d scholchat -f "c:\Users\Prince\Documents\PROJECT SCHOLCHAT\2025backendSchoolchat\db-init\src\main\resources\sql\schema-postgres.sql"
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d scholchat -c "GRANT ALL ON SCHEMA ressources TO scholchat_user; GRANT ALL ON ALL TABLES IN SCHEMA ressources TO scholchat_user; GRANT ALL ON ALL SEQUENCES IN SCHEMA ressources TO scholchat_user; GRANT USAGE ON SCHEMA ressources TO scholchat_user; ALTER DEFAULT PRIVILEGES IN SCHEMA ressources GRANT ALL ON TABLES TO scholchat_user; ALTER DEFAULT PRIVILEGES IN SCHEMA ressources GRANT ALL ON SEQUENCES TO scholchat_user;"
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d scholchat -f "c:\Users\Prince\Documents\PROJECT SCHOLCHAT\2025backendSchoolchat\db-init\src\main\resources\sql\data-postgres.sql"
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d scholchat -f "c:\Users\Prince\Documents\PROJECT SCHOLCHAT\2025backendSchoolchat\db-init\src\main\resources\sql\notifications-schema.sql"
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d scholchat -f "c:\Users\Prince\Documents\PROJECT SCHOLCHAT\2025backendSchoolchat\db-init\src\main\resources\sql\migration-add-visibility.sql"
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d scholchat -f "c:\Users\Prince\Documents\PROJECT SCHOLCHAT\2025backendSchoolchat\db-init\src\main\resources\sql\migration-add-notifications.sql"
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d scholchat -f "c:\Users\Prince\Documents\PROJECT SCHOLCHAT\2025backendSchoolchat\db-init\src\main\resources\sql\migration-add-gestionnaires.sql"
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d scholchat -f "c:\Users\Prince\Documents\PROJECT SCHOLCHAT\2025backendSchoolchat\db-init\src\main\resources\sql\migration-questions.sql"
```

---

## METHODE DETAILLEE : Etape par etape dans psql

### Etape 1 : Se connecter a PostgreSQL

```
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
```

### Etape 2 : Creer les utilisateurs

```sql
-- Utilisateur owner de la base
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='scholchat') THEN CREATE ROLE scholchat WITH LOGIN PASSWORD 'scholchat'; END IF; END $$;

-- Utilisateur utilise par le backend Spring Boot
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='scholchat_user') THEN CREATE ROLE scholchat_user WITH LOGIN PASSWORD 'StrongPassword123'; END IF; END $$;
```

### Etape 3 : Creer la base de donnees

```sql
CREATE DATABASE scholchat OWNER scholchat_user;
```

> Si elle existe deja : `DROP DATABASE IF EXISTS scholchat;` puis recreer.

### Etape 4 : Se connecter a la base

```
\c scholchat
```

### Etape 5 : Creer le schema et les tables

```
\i 'c:/Users/Prince/Documents/PROJECT SCHOLCHAT/2025backendSchoolchat/db-init/src/main/resources/sql/schema-postgres.sql'
```

### Etape 6 : Accorder les permissions au backend

```sql
GRANT ALL PRIVILEGES ON SCHEMA ressources TO scholchat_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ressources TO scholchat_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ressources TO scholchat_user;
GRANT USAGE ON SCHEMA ressources TO scholchat_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA ressources GRANT ALL ON TABLES TO scholchat_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA ressources GRANT ALL ON SEQUENCES TO scholchat_user;
```

> IMPORTANT : Sans cette etape, le backend retournera "permission denied for schema ressources".

### Etape 7 : Inserer les donnees initiales

```
\i 'c:/Users/Prince/Documents/PROJECT SCHOLCHAT/2025backendSchoolchat/db-init/src/main/resources/sql/data-postgres.sql'
```

### Etape 8 : Appliquer les migrations

```
\i 'c:/Users/Prince/Documents/PROJECT SCHOLCHAT/2025backendSchoolchat/db-init/src/main/resources/sql/notifications-schema.sql'
\i 'c:/Users/Prince/Documents/PROJECT SCHOLCHAT/2025backendSchoolchat/db-init/src/main/resources/sql/migration-add-visibility.sql'
\i 'c:/Users/Prince/Documents/PROJECT SCHOLCHAT/2025backendSchoolchat/db-init/src/main/resources/sql/migration-add-notifications.sql'
\i 'c:/Users/Prince/Documents/PROJECT SCHOLCHAT/2025backendSchoolchat/db-init/src/main/resources/sql/migration-add-gestionnaires.sql'
\i 'c:/Users/Prince/Documents/PROJECT SCHOLCHAT/2025backendSchoolchat/db-init/src/main/resources/sql/migration-questions.sql'
\i 'c:/Users/Prince/Documents/PROJECT SCHOLCHAT/2025backendSchoolchat/db-init/src/main/resources/sql/migration-multi-roles.sql'
```

### Etape 9 : Verifier

```sql
SET search_path TO ressources;
\dt
```

### Etape 10 : Quitter

```
\q
```

---

## Reinitialisation complete

Pour tout recommencer depuis zero :

```sql
-- Depuis postgres=# (pas depuis scholchat=#)
DROP DATABASE IF EXISTS scholchat;
CREATE DATABASE scholchat OWNER scholchat_user;
```

Puis reprendre a l'**Etape 4**.

---

## Pour la base distante (Render)

Remplacer `-U postgres -d scholchat` par l'URL de connexion :

```
"C:\Program Files\PostgreSQL\18\bin\psql.exe" "postgresql://schoolchatadminbd:R0MZ1wjVFL6mHO5m4fikqDXNIXCc0L1Q@dpg-d4tl037gi27c73bmal90-a.frankfurt-postgres.render.com/schoolchatdev"
```

Puis utiliser les memes commandes `\i` pour charger les fichiers, ou utiliser `-f` :

```bat
"C:\Program Files\PostgreSQL\18\bin\psql.exe" "postgresql://schoolchatadminbd:R0MZ1wjVFL6mHO5m4fikqDXNIXCc0L1Q@dpg-d4tl037gi27c73bmal90-a.frankfurt-postgres.render.com/schoolchatdev" -f "chemin/vers/fichier.sql"
```

---

## Configuration du backend Spring Boot

Le backend utilise ces identifiants (dans `application-local.properties`) :

| Parametre | Valeur |
|-----------|--------|
| `spring.datasource.url` | `jdbc:postgresql://localhost:5432/scholchat` |
| `spring.datasource.username` | `scholchat_user` |
| `spring.datasource.password` | `StrongPassword123` |

---

## Donnees inserees par data-postgres.sql

| Table | Nombre | Description |
|-------|--------|-------------|
| utilisateurs | 18 | Tous les utilisateurs (admin, profs, parents, eleves, gestionnaires) |
| etablissements | 3 | Etablissements scolaires |
| professeurs | 4 | Profils professeurs |
| parents | 2 | Profils parents |
| eleves | 3 | Profils eleves |
| repetiteurs | 1 | Profil repetiteur |
| gestionnaires | 2 | Profils gestionnaires |
| classes | 9 | Classes scolaires |
| matieres | 4 | Matieres enseignees |
| classe_eleves | 5 | Eleves dans les classes |
| professeur_classes_moderees | 8 | Profs moderateurs de classes |
| droit_publication | 2 | Droits de publication |
| acceder | 8 | Acces aux classes |
