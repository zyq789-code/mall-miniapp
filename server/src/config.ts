/** JWT signing/verification secret. Override in production via env `JWT_SECRET`. */
export const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me'
