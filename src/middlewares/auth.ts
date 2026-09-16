import { Request, Response, NextFunction } from 'express';
import { getAuth, clerkClient } from '@clerk/express';
import { prisma } from '@/lib/prisma';
import type { User } from '../../generated/prisma/client';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace -- `declare global { namespace Express {...} }` is the only way TS supports augmenting Express's own Request interface with a custom field.
    namespace Express {
        interface Request {
            dbUser?: User;
        }
    }
}

async function resolveViaApiKey(req: Request): Promise<User | null> {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return null;

    const apiKey = header.slice(7).trim();
    if (!apiKey) return null;

    return prisma.user.findUnique({ where: { apiKey } });
}

async function resolveViaClerkSession(req: Request): Promise<User | null> {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) return null;

    let dbUser = await prisma.user.findUnique({ where: { clerkId } });

    if (!dbUser) {
        const clerkUser = await clerkClient.users.getUser(clerkId);
        const email = clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

        if (!email) {
            throw new Error('CLERK_NO_EMAIL');
        }

        dbUser = await prisma.user.upsert({
            where: { clerkId },
            update: {},
            create: {
                clerkId,
                email,
                name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null,
            },
        });
    }

    return dbUser;
}

export const resolveDbUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dbUser = (await resolveViaApiKey(req)) ?? (await resolveViaClerkSession(req));

        if (!dbUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        req.dbUser = dbUser;
        next();
    } catch (error) {
        if (error instanceof Error && error.message === 'CLERK_NO_EMAIL') {
            return res.status(400).json({ error: 'Clerk account has no email address on file' });
        }
        console.error('resolveDbUser error:', error);
        return res.status(500).json({ error: 'Unable to resolve authenticated user' });
    }
}
