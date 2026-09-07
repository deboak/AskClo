import { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/response";
import { JwtPayload, verifyAccessToken } from "../utils/jwt";

export type { JwtPayload };

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

/** Default auth — requires a fully verified token (phone verified). */
export function auth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    sendError(res, "Missing or invalid authorization header", { statusCode: 401 });
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.scope !== "full") {
      sendError(res, "Phone verification required", { statusCode: 403 });
      return;
    }

    req.user = payload;
    next();
  } catch {
    sendError(res, "Invalid or expired token", { statusCode: 401 });
  }
}

/** Use only on routes that intentionally accept provisional tokens (e.g. phone setup, OTP). */
export function allowPartialAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    sendError(res, "Missing or invalid authorization header", { statusCode: 401 });
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    sendError(res, "Invalid or expired token", { statusCode: 401 });
  }
}

/** RBAC guard — requires the user's role to match one of the allowed roles. */
// export function requireRoles(...roles: string[]) {
//   return (req: Request, res: Response, next: NextFunction): void => {
//     const userRole = req.user?.role;

//     if (!userRole || !roles.includes(userRole)) {
//       sendError(res, "Forbidden: insufficient permissions", { statusCode: 403 });
//       return;
//     }

//     next();
//   };
