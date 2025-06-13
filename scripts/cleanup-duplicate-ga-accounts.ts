import { PrismaClient } from '../src/prisma/generated/client';

const prisma = new PrismaClient();

interface GaAccount {
  id: string;
  gaAccountId: string;
  gaAccountName: string;
  deleted: boolean;
}

interface GaProperty {
  id: string;
  gaPropertyId: string;
  gaAccountId: string;
  deleted: boolean;
}

async function cleanupDuplicateGaAccounts() {
  try {
    // Get all GaAccounts grouped by gaAccountId
    const accounts = await prisma.gaAccount.groupBy({
      by: ['gaAccountId'],
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gt: 1,
          },
        },
      },
    });

    console.log(`Found ${accounts.length} groups of duplicate GaAccounts`);

    for (const group of accounts) {
      // Get all GaAccounts with this gaAccountId
      const duplicates = await prisma.gaAccount.findMany({
        where: {
          gaAccountId: group.gaAccountId,
        },
        orderBy: {
          deleted: 'asc', // Keep non-deleted accounts first
        },
      });

      // Find the most descriptive name (excluding generic names)
      const mostDescriptiveAccount = duplicates.reduce((best: GaAccount, current: GaAccount) => {
        const currentName = current.gaAccountName.toLowerCase();
        const bestName = best.gaAccountName.toLowerCase();
        
        // Skip generic names
        if (currentName.includes('default') || currentName === current.gaAccountId) {
          return best;
        }
        
        // Prefer names that are more descriptive (longer and not just numbers)
        if (currentName.length > bestName.length && !/^\d+$/.test(currentName)) {
          return current;
        }
        
        return best;
      }, duplicates[0]);

      console.log(`\nProcessing gaAccountId: ${group.gaAccountId}`);
      console.log(`Keeping account: ${mostDescriptiveAccount.gaAccountName} (${mostDescriptiveAccount.id})`);

      // For each user, keep only the earliest UserToGaAccount for the kept GaAccount
      const userToGaAccounts = await prisma.userToGaAccount.findMany({
        where: {
          gaAccountId: {
            in: duplicates.map((acc: GaAccount) => acc.id),
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      const userToKeep: Record<string, string> = {};
      for (const utga of userToGaAccounts) {
        if (!userToKeep[utga.userId]) {
          userToKeep[utga.userId] = utga.id;
        }
      }

      // Delete duplicate UserToGaAccount records
      const duplicateUserToGaAccounts = userToGaAccounts.filter((utga) => userToKeep[utga.userId] !== utga.id);
      if (duplicateUserToGaAccounts.length > 0) {
        await prisma.userToGaAccount.deleteMany({
          where: {
            id: {
              in: duplicateUserToGaAccounts.map((utga) => utga.id),
            },
          },
        });
        console.log(`Deleted ${duplicateUserToGaAccounts.length} duplicate UserToGaAccount records`);
      }

      // Update UserToGaAccount relations
      const userToGaAccountUpdates = await prisma.userToGaAccount.updateMany({
        where: {
          gaAccountId: {
            in: duplicates
              .filter((acc: GaAccount) => acc.id !== mostDescriptiveAccount.id)
              .map((acc: GaAccount) => acc.id),
          },
        },
        data: {
          gaAccountId: mostDescriptiveAccount.id,
        },
      });

      console.log(`Updated ${userToGaAccountUpdates.count} UserToGaAccount relations`);

      // Update GaProperty relations
      const gaPropertyUpdates = await prisma.gaProperty.updateMany({
        where: {
          gaAccountId: {
            in: duplicates
              .filter((acc: GaAccount) => acc.id !== mostDescriptiveAccount.id)
              .map((acc: GaAccount) => acc.id),
          },
        },
        data: {
          gaAccountId: mostDescriptiveAccount.id,
        },
      });

      console.log(`Updated ${gaPropertyUpdates.count} GaProperty relations`);

      // Delete duplicate GaAccounts
      const deletedAccounts = await prisma.gaAccount.deleteMany({
        where: {
          id: {
            in: duplicates
              .filter((acc: GaAccount) => acc.id !== mostDescriptiveAccount.id)
              .map((acc: GaAccount) => acc.id),
          },
        },
      });

      console.log(`Deleted ${deletedAccounts.count} duplicate GaAccounts`);
    }

    // Clean up duplicate GaProperties
    console.log('\nCleaning up duplicate GaProperties...');
    
    // Get all GaProperties grouped by gaPropertyId
    const properties = await prisma.gaProperty.groupBy({
      by: ['gaPropertyId'],
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gt: 1,
          },
        },
      },
    });

    console.log(`Found ${properties.length} groups of duplicate GaProperties`);

    for (const group of properties) {
      // Get all GaProperties with this gaPropertyId
      const duplicates = await prisma.gaProperty.findMany({
        where: {
          gaPropertyId: group.gaPropertyId,
        },
      });

      console.log(`\nProcessing gaPropertyId: ${group.gaPropertyId}`);
      console.log(`Keeping property: ${duplicates[0].gaPropertyName} (${duplicates[0].id})`);

      // Delete duplicate GaProperties
      const deletedProperties = await prisma.gaProperty.deleteMany({
        where: {
          id: {
            in: duplicates
              .filter((prop: GaProperty) => prop.id !== duplicates[0].id)
              .map((prop: GaProperty) => prop.id),
          },
        },
      });

      console.log(`Deleted ${deletedProperties.count} duplicate GaProperties`);
    }

    console.log('\nCleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDuplicateGaAccounts(); 