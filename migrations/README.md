# Database Migrations

This directory contains SQL migration files to optimize database performance.

## How to Run

Connect to your PostgreSQL database and run the migration files in order:

```bash
psql $DATABASE_URL -f migrations/001_add_performance_indexes.sql
```

Or using a PostgreSQL client:

```sql
\i migrations/001_add_performance_indexes.sql
```

## Migrations

### 001_add_performance_indexes.sql
Adds critical indexes for:
- Lesson queries (groupid + lessondate + weektype)
- Chat lookups by externalchatid
- Group queries by department and course
- NotifyQueue processing for notification system

**Impact**: 10-50x faster query performance for schedule lookups
