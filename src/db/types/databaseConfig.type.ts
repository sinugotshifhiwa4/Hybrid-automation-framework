import sql from 'mssql';

export const dbConfig: sql.config = {
  server: 'CCTSHIFHIWA240816',
  database: 'tshifhiwaDemo',
  user: 'demoAdmin',
  password: 'password123',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};