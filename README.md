# Presio

Upload a PDF presentation, get a short link, and control the slideshow from one browser window while viewers watch in another.

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project

## Supabase Setup

1. Create a new Supabase project
2. Run the SQL in `supabase-schema.sql` in the Supabase SQL editor to create the `sessions` table and `presentations` storage bucket

## Environment Variables

**Server** (`server/.env`):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001
```

**Client** (`client/.env`):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Running Locally

```bash
# Terminal 1 - Server
cd server
cp .env.example .env   # fill in your Supabase credentials
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

The client dev server proxies `/api` and `/socket.io` requests to the server on port 3001.

## Usage

1. Open `http://localhost:5173`
2. Drop a PDF file onto the upload zone
3. Copy the **Controller** link and open it in one window
4. Copy the **Viewer** link and open it in another window (or send to another device)
5. Use the Previous/Next buttons (or arrow keys) in the controller to navigate slides

Presentations automatically expire after 24 hours.

## TODO

- [ ] Add "F" key to toggle fullscreen mode in the viewer view.
- [ ] Add "M" key to mute presentation from the controller view for all viewers.
- [ ] Add "CMD+Left" and "CMD+Right" to navigate to first/last slides in the controller view.
- [ ] Make all the cards in the controller view movable resizable and draggable and toggle on off.
  - [ ] Each card component should be spit into a separate file and imported into the ControllerView component.
  - [ ] Timer should also be a card and should be toggle able. The timer should include start/stop and reset buttons. The timers can probably be handled on the client side without the need to sync to the DB. It can be persisted to the browser storage.
- [ ] The menu icon in the viewer window is not visible on white slide backgrounds. Also make sure the cursor changes to a pointer when hovering on the menu.
- [ ] The connection indicator in the viewer view should also fade out when the cursor is hidden.
- [ ] The join existing input field should be visible in the home screen but the buttons to join as controller/viewers should only appear when a code is entered.
- [ ] The codes should not be case sensitive (default to uppercase)
