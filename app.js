const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dateFormat = require("date-fns/format");

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

const isValidDate = (date) => {
  var dateArr = date.split("-");
  let year = dateArr[0];
  let mon = dateArr[1];
  let day = dateArr[2];
  return year.length === 4 && mon < 13 && day < 32;
};

const checkValidDate = (request, response, next) => {
  let { date } = request.query;
  var dateObj = date.split("-");
  let year = dateObj[0];
  let mon = dateObj[1];
  let dat = dateObj[2];
  if (year.length === 4 && mon < 13 && day < 32) {
    next();
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
};

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
  } else if (isValidDate(dueDate) !== true) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    next();
  }
};

const checkValidPutQuery = (request, response, next) => {
  const { priority, status, category, todo, dueDate } = request.body;
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
    case dueDate !== undefined:
      if (isValidDate(dueDate) === true) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Due Date");
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

app.get("/agenda/", checkValidDate, async (request, response) => {
  var { date } = request.query;

  let newDateArr = date.split("-");
  let year = newDateArr[0];
  let month = newDateArr[1] - 1;
  let day = newDateArr[2];
  let fDateA = dateFormat(new Date(year, month, day), "yyyy-MM-dd");

  let dArr = fDateA.split("-");
  let y = dArr[0];
  let m = dArr[1];
  let d = dArr[2];
  const getDateTodo = `
    SELECT 
      *
    FROM 
      todo
    WHERE 
      strftime("%Y", due_date) == '${y}'
      AND strftime("%m", due_date) == '${m}'
      AND strftime("%d", due_date) == '${d}';`;

  const dateTodo = await database.get(getDateTodo);
  response.send(convertDbObjectToResponseObject(dateTodo));
});

app.post("/todos/", checkValidRequestQuery, async (request, response) => {
  let { id, todo, priority, status, category, dueDate } = request.body;
  let dateArr = dueDate.split("-");
  let year = dateArr[0];
  let mon = dateArr[1] - 1;
  let day = dateArr[2];
  let fDate = dateFormat(new Date(year, mon, day), "yyyy-MM-dd");
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status, category, due_date)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}', '${category}', '${fDate}');`;
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
    dueDate = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}',
      due_date='${dueDate}'
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
