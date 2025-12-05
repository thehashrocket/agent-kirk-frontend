
import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('Fetching valid IDs for API test...');

    try {
        const emailClientRelation = await prisma.userToEmailClient.findFirst();
        const uspsClientRelation = await prisma.userToUspsClient.findFirst();

        if (!emailClientRelation || !uspsClientRelation) {
            console.error('Failed to retrieve client relations.');
            return;
        }

        const userId = emailClientRelation.userId;
        const emailClientId = emailClientRelation.emailClientId;
        const uspsClientId = uspsClientRelation.uspsClientId;

        console.log('\nTest the API with:');
        console.log(`curl "http://localhost:3005/api/channels/campaign-aggregation?userId=${userId}&emailClientId=${emailClientId}&uspsClientId=${uspsClientId}&fromDate=2020-01-01&toDate=2025-12-31"`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
