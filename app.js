const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const days = require("date-fns/format");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log("DB Error: ${error.message}");
    process.exit(1);
  }
};

initializeDbAndServer();

let priorities = ["HIGH", "MEDIUM", "LOW"];
let statuses = ["TO DO", "IN PROGRESS", "DONE"];
let categories = ["WORK", "HOME", "LEARNING"];

const checkValidQuery = (request, response, next) => {
  const { priority, status, category, search_q = "", dueDate } = request.query;
  const n = priorities.includes(priority);
  switch (true) {
    case priority !== undefined:
      if (priorities.includes(priority)) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case status !== undefined:
      if (statuses.includes(status)) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case category !== undefined:
      if (categories.includes(category)) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case search_q !== "":
      next();
      break;
    default:
      break;
  }
};

const checkValidRequestQuery = (request, response, next) => {
  const { priority, status, category, dueDate } = request.body;
  const n = priorities.includes(priority);
  if (priorities.includes(priority) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (statuses.includes(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (categories.includes(category) !== true) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else {
    next();
  }
};

const checkValidPutQuery = (request, response, next) => {
  const { priority, status, category, todo } = request.body;
  const n = priorities.includes(priority);
  switch (true) {
    case priority !== undefined:
      if (priorities.includes(priority)) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case status !== undefined:
      if (statuses.includes(status)) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case category !== undefined:
      if (categories.includes(category)) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case todo !== "":
      next();
      break;
    default:
      break;
  }
};

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(convertDbObjectToResponseObject(todo));
});

app.get("/todos/", checkValidQuery, async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case priority !== undefined:
      getTodoQuery = `
        SELECT 
          *
        FROM
          todo
        WHERE 
            priority = '${priority}';`;
      break;
    case status !== undefined:
      getTodoQuery = `
          SELECT 
            *
          FROM
            todo
          WHERE
            status = '${status}';`;
      break;
    case category !== undefined:
      getTodoQuery = `
          SELECT 
            *
          FROM
            todo
          WHERE 
            category = '${category}';`;
      break;
    case priority !== undefined && status !== undefined:
      getTodoQuery = `
          SELECT 
            *
          FROM
            todo
          WHERE
            priority = '${priority}'
            AND status = '${status}';`;
      break;
    case category !== undefined && status !== undefined:
      getTodoQuery = `
          SELECT 
            *
          FROM
            todo
          WHERE 
            category = '${category}'
            AND status = '${status}';`;
      break;
    default:
      getTodoQuery = `
          SELECT 
            *
          FROM
            todo
          WHERE 
            todo LIKE '%${search_q}%';`;
      break;
  }

  data = await database.all(getTodoQuery);
  response.send(
    data.map((eachData) => convertDbObjectToResponseObject(eachData))
  );
});

app.get("/agenda/", async (request, response) => {
  let { date } = request.query;
  let dateNew = date.split("-");
  let year = dateNew[0];
  let month = dateNew[1];
  let day = dateNew[2];
  let dateObj = format(new Date(year, month, day), "yyyy-MM-dd");

  const getDateTodo = `
      SELECT 
        *
      FROM 
        todo;`;
  const dateTodo = await database.all(getDateTodo);
  response.send(convertDbObjectToResponseObject(dateTodo));
});

app.post("/todos/", checkValidRequestQuery, async (request, response) => {
  const { id, todo, priority, status, category } = request.body;
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status, category)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}', '${category}');`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", checkValidPutQuery, async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoQuery = `
      SELECT
        *
      FROM
        todo
      WHERE 
        id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}'
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `
      DELETE FROM
        todo
      WHERE 
        id = ${todoId};`;

  await database.run(deleteTodo);
  response.send("Todo Deleted");
});

module.exports = app;
