import crypto from 'crypto';

export function generateId(type) {
    const prefixes = {
        user: 'USER',
        post: 'POST',
        comment: 'CMT',
        community: 'COM',
    };

    const prefix = prefixes[type]

    if (!prefix) {
        throw new Error(`Invalid entity type: ${type}`);
    }

    return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}
export default generateId;