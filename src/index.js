const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((user) => user.username === username);
  if (!user) {
    return response.status(400).json({ error: "User doesn't exist" });
  }

  request.user = user;

  return next();
}

function checksExistsTodo(request, response, next) {
  const {
    user,
    params: { id },
  } = request;

  const todo = user.todos.find((todo) => todo.id === id);
  if (!todo) {
    return response.status(404).json({ error: "Todo not found" });
  }

  request.todo = todo;

  return next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  try {
    if (!name) {
      throw new Error("Invalid name");
    }

    if (!username) {
      throw new Error("Invalid username");
    }

    if (users.some((user) => user.username === username)) {
      throw new Error("User already exists");
    }
  } catch (e) {
    return response.status(400).json({ error: e.message });
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };
  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.status(200).json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  user.todos.push(newTodo);

  return response.status(201).json(newTodo);
});

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  checksExistsTodo,
  (request, response) => {
    const {
      todo,
      body: { title, deadline },
    } = request;

    todo.title = title;
    todo.deadline = new Date(deadline);

    return response.status(201).json(todo);
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  checksExistsTodo,
  (request, response) => {
    const { todo } = request;

    todo.done = true;

    return response.status(201).json(todo);
  }
);

app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checksExistsTodo,
  (request, response) => {
    const { user, todo } = request;

    user.todos.splice(todo, 1);

    return response.status(204).json(user.todos);
  }
);

module.exports = app;
