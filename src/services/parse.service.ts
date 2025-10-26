import { logger } from '../utils/logger.js';

const PARSE_ENDPOINT = 'http://localhost:8000/parse';

export async function triggerGroupParsing(groupId: number): Promise<void> {
    const url = `${PARSE_ENDPOINT}?group_id=${groupId}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            const body = await response.text().catch(() => undefined);

            logger.error('Parser request failed', {
                groupId,
                status: response.status,
                body,
            });
            return;
        }

        logger.info('Parser triggered', { groupId });
    } catch (error) {
        logger.error('Parser request error', { groupId, error });
    }
}
