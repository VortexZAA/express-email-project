
import 'dotenv/config.js';
let environment = process.env;

import PocketBase from 'pocketbase';
const pb = new PocketBase(environment.POCKETBASE_API_URL);

pb.autoCancellation(false);

export default pb;