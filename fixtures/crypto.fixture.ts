import { test as baseTest } from '@playwright/test';
import { EnvironmentSecretFileManager } from '../src/cryptography/manager/environmentSecretFileManager';
import { CryptoService } from '../src/cryptography/service/cryptoService';
import { EncryptionManager } from '../src/cryptography/manager/encryptionManager';
import { EnvironmentFileParser } from '../src/cryptography/manager/environmentFileParser';
import { CryptoOrchestrator } from '../src/cryptography/service/cryptoOrchestrator';

type customFixtures = {
  environmentSecretFileManager: EnvironmentSecretFileManager;
  cryptoService: CryptoService;
  encryptionManager: EncryptionManager;
  environmentFileParser: EnvironmentFileParser;
  cryptoOrchestrator: CryptoOrchestrator;
};

export const cryptoFixtures = baseTest.extend<customFixtures>({
  environmentSecretFileManager: async ({}, use) => {
    await use(new EnvironmentSecretFileManager());
  },
  cryptoService: async ({}, use) => {
    await use(new CryptoService());
  },
  encryptionManager: async ({ environmentFileParser }, use) => {
    await use(new EncryptionManager(environmentFileParser));
  },
  environmentFileParser: async ({}, use) => {
    await use(new EnvironmentFileParser());
  },
  cryptoOrchestrator: async ({ encryptionManager, environmentSecretFileManager }, use) => {
    await use(new CryptoOrchestrator(encryptionManager, environmentSecretFileManager));
  },
});

export const test = cryptoFixtures;
export const expect = baseTest.expect;
