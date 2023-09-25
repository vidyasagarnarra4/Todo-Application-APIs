const express = require("express");
const app = express();

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";

  const requestQuery = request.query;
  const { search_q = "", priority, status } = requestQuery;

  switch (true) {
    case hasPriorityAndStatusProperties(requestQuery):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE "%${search_q}%"
                AND priority = "${priority}"
                AND status = "${status}";
        `;
      break;
    case hasPriorityProperty(requestQuery):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE "%${search_q}%"
                AND priority = "${priority}";
        `;
      break;
    case hasStatusProperty(requestQuery):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo like "%${search_q}%"
                AND status = "${status}";
        `;
      break;
    default:
      getTodosQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE "%${search_q}%";
        `;
      break;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getOneTodoQuery = `
        SELECT
            *
        FROM
            todo
        WHERE
            id = "${todoId}";
    `;
  const todoObject = await db.get(getOneTodoQuery);
  response.send(todoObject);
});

app.post("/todos/", async (request, response) => {
  const addTodoDetails = request.body;
  const { id, todo, priority, status } = addTodoDetails;
  const addTodoQuery = `
        INSERT INTO
            todo(id, todo, priority, status)
        VALUES
            (${id}, "${todo}", "${priority}", "${status}");
    `;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { todo, priority, status } = request.body;
  let updateTodoQuery = "";

  switch (true) {
    case priority !== undefined:
      updateTodoQuery = `
                UPDATE
                    todo
                SET
                    priority = "${priority}"
                WHERE
                    id = ${todoId};
            `;
      await db.run(updateTodoQuery);
      response.send("Priority Updated");
      break;
    case status !== undefined:
      updateTodoQuery = `
                UPDATE
                    todo
                SET
                    status = "${status}"
                WHERE
                    id = ${todoId};
            `;
      await db.run(updateTodoQuery);
      response.send("Status Updated");
      break;
    case todo !== undefined:
      updateTodoQuery = `
                UPDATE
                    todo
                SET
                    todo = "${todo}"
                WHERE
                    id = ${todoId};
            `;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE FROM 
            todo
        WHERE 
            id = ${todoId};
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
