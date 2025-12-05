
import 'dotenv/config';
import { getCampaignAggregationMetrics } from '../src/lib/services/campaign-aggregation';
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('Running Campaign Aggregation Service Verification...');

    try {
        // Fetch a user who has both email and usps clients
        const user = await prisma.user.findFirst({
            where: {
                emailClients: { some: {} },
                uspsClients: { some: {} },
            },
            include: {
                emailClients: true,
                uspsClients: true,
            }
        });

        if (!user) {
            console.log('No user found with both email and usps clients. Trying to find separate users/clients for testing purposes (though service requires one user context usually).');
            // Fallback: just get any user, any email client, any usps client to test the function signature/logic, 
            // even if they aren't associated (might throw access error depending on service logic).
            // The service checks access: `validateEmailClientAccess` and `userAccountAssociation`.
            // So we MUST find a valid association.
            console.error('Cannot verify: No user found with both Email and USPS clients linked.');
            return;
        }

        const userId = user.id;
        // The include above returns arrays of relations, but the types might need specific access
        // actually `include` in findFirst returns the relations on the object.
        // Let's re-fetch to be safe or just use the IDs if the types allow.
        // Wait, `user.emailClients` is `UserToEmailClient[]`.

        const emailClientRelation = await prisma.userToEmailClient.findFirst({ where: { userId } });
        const uspsClientRelation = await prisma.userToUspsClient.findFirst({ where: { userId } });

        if (!emailClientRelation || !uspsClientRelation) {
            console.error('Failed to retrieve client relations.');
            return;
        }

        const emailClientId = emailClientRelation.emailClientId;
        const uspsClientId = uspsClientRelation.uspsClientId;

        console.log(`Testing with User: ${userId}, EmailClient: ${emailClientId}, UspsClient: ${uspsClientId}`);

        const metrics = await getCampaignAggregationMetrics({
            userId,
            emailClientId,
            uspsClientId,
            fromDate: '2020-01-01',
            toDate: '2025-12-31',
        });

        console.log('Metrics retrieved successfully:');
        console.log(JSON.stringify(metrics, null, 2));

    } catch (error) {
        console.error('Error fetching metrics:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
