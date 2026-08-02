browser sends the request via api.js 
  createCard: async (front, back) => {
    const response = await fetch(`${API_BASE_URL}/cards`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ front, back })
    });
    
    //  sends POST http://localhost:5001/api/cards with JSON { front, back } and a JWT

    if (!response.ok) throw new Error('Failed to create card');
    return normalizeCard(await response.json());
  },


2. Request hits your server and runs middleware in order:

server.js

cors — allow the React origin
express.json() — turn the JSON body into req.body = { front, back }
Mount match: path starts with /api/cards → hand off to cardRoutes


3. Card router (routes/cards.js)

router.use(auth);
// ...
router.post('/', createCard);

auth middleware is claled

4. auth.js

const auth = (req, res, next) => 
  // ...
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
  req.user = decoded;  // e.g. { id: "abc123..." }
  next();

Reads the Bearer token
Verifies it
Puts the user on req.user
Calls next() → continue to the controller


5. Controller saves to MongoDB

Reads front / back from req.body
Builds a Mongoose Card (defaults fill easeFactor, interval, etc.)
card.save() writes a document to MongoDB
Responds with 201 and the saved card JSON (includes _id, userId, dates, …)

6. Back in api.js

When that response arrives:

if (!response.ok) — if status isn’t 2xx, throw
await response.json() — parse the body
normalizeCard(...) — copy Mongo’s _id into an id field React likes
return that card to whoever called api.createCard
