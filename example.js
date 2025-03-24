// Define validation schemas
const todoSchema = {
    title: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 100
    },
    completed: {
      type: 'boolean',
      required: false
    }
  };
  
  // Define API routes
  router.get('/api/todos', async (request) => {
    const todos = db.findAll();
    
    // Create a collection resource
    const collection = new Collection({ type: 'todos' });
    
    // Add collection links
    collection.addLink('self', '/api/todos');
    collection.addLink('create', '/api/todos', 'POST');
    
    // Add items to the collection
    collection.addItems(todos.map(todoToResource));
    
    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    
    // Setup pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedTodos = todos.slice(start, end);
    
    // Update collection with paginated items
    collection.setPage(page);
    collection.setPageSize(pageSize);
    collection.setTotal(todos.length);
    
    // Add pagination links
    collection.addPaginationLinks('/api/todos');
    
    return collection;
  });
  
  router.get('/api/todos/:id', async (request) => {
    const id = request.params.id;
    const todo = db.findById(id);
    
    if (!todo) {
      throw new NotFoundError(`Todo with ID ${id} not found`);
    }
    
    return todoToResource(todo);
  });
  
  router.post('/api/todos', async (request) => {
    // Parse request body
    const body = await parseBody(request);
    
    // Validate request data
    const validatedData = validateRequest(body, todoSchema);
    
    // Create a new todo
    const newTodo = db.create({
      title: validatedData.title,
      completed: validatedData.completed !== undefined ? validatedData.completed : false
    });
    
    // Return the created resource
    return todoToResource(newTodo);
  });
  
  router.put('/api/todos/:id', async (request) => {
    const id = request.params.id;
    
    // Check if todo exists
    if (!db.findById(id)) {
      throw new NotFoundError(`Todo with ID ${id} not found`);
    }
    
    // Parse request body
    const body = await parseBody(request);
    
    // Validate request data
    const validatedData = validateRequest(body, todoSchema);
    
    // Update the todo
    const updatedTodo = db.update(id, validatedData);
    
    // Return the updated resource
    return todoToResource(updatedTodo);
  });
  
  router.delete('/api/todos/:id', async (request) => {
    const id = request.params.id;
    
    // Check if todo exists
    if (!db.findById(id)) {
      throw new NotFoundError(`Todo with ID ${id} not found`);
    }
    
    // Delete the todo
    db.delete(id);
    
    // Return no content
    return null;
  });
  
  router.post('/api/todos/:id/toggle', async (request) => {
    const id = request.params.id;
    const todo = db.findById(id);
    
    if (!todo) {
      throw new NotFoundError(`Todo with ID ${id} not found`);
    }
    
    // Toggle completed status
    const updatedTodo = db.update(id, {
      completed: !todo.completed
    });
    
    // Return the updated resource
    return todoToResource(updatedTodo);
  });
  
  // Add a root resource
  router.get('/api', async () => {
    const root = new Resource()
      .setType('api')
      .setProperty('name', 'Todo API')
      .setProperty('version', '1.0.0')
      .setProperty('description', 'A simple HATEOAS API for a todo list application')
      .addLink('self', '/api')
      .addLink('todos', '/api/todos')
      .addLink('documentation', '/api/docs')
      .setState('active');
    
    return root;
  });
  
  // Start the server
  console.log('Starting Todo API server...');
  app.start().catch(console.error);/**
   * Example HATEOAS API using the web-hateoas framework
   * 
   * This example demonstrates how to create a simple HATEOAS API 
   * for a todo list application.
   */
  
  import { 
    createApp,
    Resource,
    Collection,
    NotFoundError,
    ValidationError,
    validateRequest
  } from './index.js';
  
  // In-memory database for storing todos
  const db = {
    todos: [
      { id: '1', title: 'Learn HATEOAS', completed: true },
      { id: '2', title: 'Build a REST API', completed: false },
      { id: '3', title: 'Write documentation', completed: false }
    ],
    
    findAll() {
      return [...this.todos];
    },
    
    findById(id) {
      return this.todos.find(todo => todo.id === id) || null;
    },
    
    create(data) {
      const newId = String(this.todos.length + 1);
      const newTodo = { id: newId, ...data };
      this.todos.push(newTodo);
      return newTodo;
    },
    
    update(id, data) {
      const index = this.todos.findIndex(todo => todo.id === id);
      if (index === -1) return null;
      
      const updatedTodo = { ...this.todos[index], ...data };
      this.todos[index] = updatedTodo;
      return updatedTodo;
    },
    
    delete(id) {
      const index = this.todos.findIndex(todo => todo.id === id);
      if (index === -1) return false;
      
      this.todos.splice(index, 1);
      return true;
    }
  };
  
  // Create application
  const app = createApp({
    port: 3000,
    host: 'localhost'
  });
  
  // Get router
  const router = app.router;
  
  // Convert a database todo to a Resource
  function todoToResource(todo) {
    return new Resource()
      .setType('todo')
      .setId(todo.id)
      .setProperty('title', todo.title)
      .setProperty('completed', todo.completed)
      .addLink('self', `/api/todos/${todo.id}`)
      .addLink('collection', '/api/todos')
      .addLink('edit', `/api/todos/${todo.id}`, 'PUT')
      .addLink('delete', `/api/todos/${todo.id}`, 'DELETE')
      .addLink('toggle', `/api/todos/${todo.id}/toggle`, 'POST');
  }