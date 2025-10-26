-- Performance optimization indexes
-- Run this migration to add indexes for faster queries

-- Index for Lesson queries by groupid and lessondate (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_lesson_group_date
ON Lesson (groupid, lessondate);

-- Index for Lesson queries filtered by weektype
CREATE INDEX IF NOT EXISTS idx_lesson_group_weektype
ON Lesson (groupid, weektype);

-- Composite index for the full query pattern (groupid + date range + weektype)
CREATE INDEX IF NOT EXISTS idx_lesson_group_date_weektype
ON Lesson (groupid, lessondate, weektype);

-- Index for ordering by lesson number
CREATE INDEX IF NOT EXISTS idx_lesson_number
ON Lesson (lessonnumber);

-- Index for Chat lookups by externalchatid (used in every user command)
CREATE INDEX IF NOT EXISTS idx_chat_external_id
ON Chat (externalchatid);

-- Index for Group lookups by department and course
CREATE INDEX IF NOT EXISTS idx_group_dept_course
ON "Group" (departmentid, course);

-- Index for active groups only
CREATE INDEX IF NOT EXISTS idx_group_active
ON "Group" (isactive) WHERE isactive = true;

-- Index for NotifyQueue processing (for notification system)
CREATE INDEX IF NOT EXISTS idx_notifyqueue_pending
ON NotifyQueue (scheduledtime, issent) WHERE issent = false;

-- Index for NotifyQueue by chatid
CREATE INDEX IF NOT EXISTS idx_notifyqueue_chat
ON NotifyQueue (chatid);

-- Add comments for documentation
COMMENT ON INDEX idx_lesson_group_date IS 'Optimizes getLessonsByGroupAndWeek queries';
COMMENT ON INDEX idx_lesson_group_weektype IS 'Optimizes week type filtering';
COMMENT ON INDEX idx_lesson_group_date_weektype IS 'Composite index for complete lesson queries';
COMMENT ON INDEX idx_chat_external_id IS 'Optimizes user authentication lookups';
COMMENT ON INDEX idx_notifyqueue_pending IS 'Optimizes notification queue processing';
