
import { Router } from 'express';
import conferenceRouter from './conference.router';
import sessionRouter from './session.router';
import speakerRouter from './speaker.router';
import organizerRouter from './organizer.router';
import announcementRouter from './announcement.router';
import sponsorRouter from './sponsor.router';
import authRouter from './auth.router';
import registrationRouter from './registration.router';
import whitelistRouter from './whitelist.router';
import miscRouter from './misc.router';
import adminRouter from './admin.router';
import checkinRouter from './checkin.router';

const mainRouter = Router();

mainRouter.use('/', authRouter);
mainRouter.use('/auth', authRouter);
mainRouter.use('/', miscRouter);
mainRouter.use('/admin', adminRouter);
mainRouter.use('/conferences', conferenceRouter);
mainRouter.use('/sessions', sessionRouter);
mainRouter.use('/speakers', speakerRouter);
mainRouter.use('/organizers', organizerRouter);
mainRouter.use('/announcements', announcementRouter);
mainRouter.use('/sponsors', sponsorRouter);
mainRouter.use('/registrations', registrationRouter);
mainRouter.use('/check-ins', checkinRouter);
mainRouter.use('/whitelists', whitelistRouter);

export default mainRouter;
