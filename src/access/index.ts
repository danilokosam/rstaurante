import type { Access } from 'payload'

/** Allows access only to authenticated CMS users. */
export const authenticated: Access = ({ req: { user } }) => Boolean(user)

/** Allows public read access for any visitor. */
export const anyone: Access = () => true
