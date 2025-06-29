export class SecurityQueries {
  public getUserSecurityInfoQuery(): string {
    return `
      SELECT 
        [Username],
        [FailedLoginCount],
        [PermittedFailedLoginCount],
        [IsLockedOut],
        [IsAdministrativeLockedOut]
      FROM [tshifhiwaDemo].[dbo].[Users]
      WHERE [Username] = @username
    `;
  }
}
