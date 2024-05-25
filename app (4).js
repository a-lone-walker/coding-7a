const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
app = express();
app.use(express.json());

let dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

let connectingDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("listening to port 3000");
    });
  } catch (error) {
    console.log(`DB Error ${error.message}`);
    process.exit(1);
  }
};

connectingDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    totalScore: dbObject.total_score,
    totalFours: dbObject.total_fours,
    totalSixes: dbObject.total_sixes,
  };
};

//API 1: Get all players
app.get("/players/", async (request, response) => {
  let query = `
    SELECT *
    FROM player_details`;
  let dbResponse = await db.all(query);
  response.send(
    dbResponse.map((eachObject) => {
      return convertDbObjectToResponseObject(eachObject);
    })
  );
});

//API 2: Player on id
app.get("/players/:playerId/", async (request, response) => {
  let { playerId } = request.params;
  let query = `
    SELECT *
    FROM player_details
    WHERE player_id = ${playerId}`;
  let dbResponse = await db.get(query);
  response.send(convertDbObjectToResponseObject(dbResponse));
});

//API 3: Updating a player using Put
app.put("/players/:playerId/", async (request, response) => {
  let { playerId } = request.params;
  let playerDetails = request.body;
  let { playerName } = playerDetails;
  let query = `
    UPDATE player_details
    SET player_name = '${playerName}'
    WHERE player_id = ${playerId}`;
  await db.run(query);
  response.send("Player Details Updated");
});

const convertDbObjectToResponseObjectMatch = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// API 4: match on id
app.get("/matches/:matchId/", async (request, response) => {
  let { matchId } = request.params;
  let query = `
    SELECT *
    FROM match_details
    WHERE match_id = ${matchId}`;
  let dbResponse = await db.get(query);
  response.send(convertDbObjectToResponseObjectMatch(dbResponse));
});

// API 5: matches of players on id
app.get("/players/:playerId/matches", async (request, response) => {
  let { playerId } = request.params;
  let query = `
   SELECT match_details.match_id, match_details.match, match_details.year
    FROM match_details NATURAL JOIN player_match_score
    WHERE player_id = ${playerId}`;
  let dbResponse = await db.all(query);
  response.send(
    dbResponse.map((eachResponse) => {
      return convertDbObjectToResponseObjectMatch(eachResponse);
    })
  );
});

// API 6: players of match on id
app.get("/matches/:matchId/players", async (request, response) => {
  let { matchId } = request.params;
  let query = `
   SELECT player_details.player_id, player_details.player_name
    FROM player_details NATURAL JOIN player_match_score
    WHERE match_id = ${matchId}`;
  let dbResponse = await db.all(query);
  response.send(
    dbResponse.map((eachResponse) => {
      return convertDbObjectToResponseObject(eachResponse);
    })
  );
});

//API 7: Player on id
app.get("/players/:playerId/playerScores", async (request, response) => {
  let { playerId } = request.params;
  let query = `
    SELECT player_details.player_id, player_details.player_name, SUM(player_match_score.score) as total_score,
    SUM(player_match_score.fours) as total_fours, SUM(player_match_score.sixes) as total_sixes
    FROM player_details NATURAL JOIN player_match_score
    WHERE player_id = ${playerId}`;
  let dbResponse = await db.get(query);
  response.send(convertDbObjectToResponseObject(dbResponse));
});

module.exports = app;
