import { test, expect } from '../../fixtures/crypto.fixture';
import SecureKeyGenerator from '../../src/cryptography/key/secureKeyGenerator';
import {
  EnvironmentConstants,
  EnvironmentSecretKeys,
} from '../../src/config/environment/dotenv/constants';
import EncryptionVerification from '../../src/cryptography/manager/encryptionVerification';
import { EnvironmentFilePaths } from '../../src/config/environment/dotenv/mapping';
import EnvironmentVariables from '../../src/config/environment/variables/variables';

test.describe.serial('Encryption Flow @full-encryption', () => {
  test('Generate secret key', async ({ cryptoOrchestrator }) => {
    await cryptoOrchestrator.generateSecretKey(
      EnvironmentConstants.ENV_DIR,
      EnvironmentConstants.BASE_ENV_FILE,
      EnvironmentSecretKeys.UAT,
      SecureKeyGenerator.generateBase64SecretKey(),
    );
  });

  test('Encrypt environment variables', async ({ cryptoOrchestrator }) => {
    await cryptoOrchestrator.encryptEnvironmentVariables(
      EnvironmentConstants.ENV_DIR,
      EnvironmentFilePaths.uat,
      EnvironmentSecretKeys.UAT,
      [EnvironmentVariables.PORTAL_USERNAME, EnvironmentVariables.PORTAL_PASSWORD, EnvironmentVariables.DB_USERNAME, EnvironmentVariables.DB_PASSWORD],
    );

    // Verify encryption
    const results = await EncryptionVerification.validateEncryption(
      ['PORTAL_USERNAME', 'PORTAL_PASSWORD'],
      EnvironmentFilePaths.uat,
    );
    expect(results.PORTAL_USERNAME).toBe(true);
    expect(results.PORTAL_PASSWORD).toBe(true);
  });
});
