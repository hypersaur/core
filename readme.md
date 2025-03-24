# Web HATEOAS Framework

A lightweight, standards-based HATEOAS framework for building hypermedia-driven APIs using web standard technologies.

## Features

- **Pure Web Standards**: Built entirely on web standards with no external dependencies
- **HATEOAS Resources**: First-class support for hypermedia resources and links
- **Content Negotiation**: Support for multiple content types (JSON, HAL, HTML)
- **State Transitions**: Built-in support for state machines and transitions
- **Validation**: Simple yet powerful validation system
- **Error Handling**: Consistent error handling with useful error types
- **Modular Design**: Clean separation of concerns for easy customization

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/web-hateoas.git

# Navigate to the project
cd web-hateoas
```

## Basic Usage

```javascript
import { createApp, Resource, Collection } from './web-hateoas/index.js';

// Create application
const app = createApp({ port: 3000 });
const router = app.router;

// Define routes
router.get('/api', async () => {
  return new Resource()
    .setType('api')
    .setProperty('name', 'Example API')
    .setProperty('version', '1.0.0')
    .addLink('self', '/api')
    .addLink('items', '/api/items');
});

router.get('/api/items', async () => {
  const collection = new Collection({ type: 'items' });
  
  // Add items to collection
  for (let i = 1; i <= 5; i++) {
    const item = new Resource()
      .setType('item')
      .setId(String(i))
      .setProperty('name', `Item ${i}`)
      .addLink('self', `/api/items/${i}`);
      
    collection.addItem(item);
  }
  
  collection.addLink('self', '/api/items');
  collection.addLink('create', '/api/items', 'POST');
  
  return collection;
});

// Start the server
app.start();
```

## Key Concepts

### Resources

Resources are the core building blocks of a HATEOAS API:

```javascript
const user = new Resource()
  .setType('user')
  .setId('123')
  .setProperty('name', 'John Doe')
  .setProperty('email', 'john@example.com')
  .addLink('self', '/api/users/123')
  .addLink('edit', '/api/users/123', 'PUT')
  .addLink('delete', '/api/users/123', 'DELETE');
```

### Collections

Collections represent groups of resources with pagination support:

```javascript
const collection = new Collection({ type: 'users' });

collection.addItems(userResources);
collection.setPage(2);
collection.setPageSize(10);
collection.setTotal(57);
collection.addPaginationLinks('/api/users');
```

### State Transitions

Resources can have state with defined transitions:

```javascript
const order = new Resource()
  .setType('order')
  .setId('456')
  .setProperty('total', 99.99)
  .setState('pending')
  .addStateTransition('pending', 'processing', 'process', '/api/orders/456/process', 'POST')
  .addStateTransition('processing', 'shipped', 'ship', '/api/orders/456/ship', 'POST')
  .addStateTransition('shipped', 'delivered', 'deliver', '/api/orders/456/deliver', 'POST');
```

### Content Negotiation

The framework supports multiple content types:

```javascript
// Client can request different formats
// GET /api/users/123
// Accept: application/json
// Accept: application/hal+json
// Accept: text/html

// Or use ?format=json, ?format=hal, ?format=html query parameter
```

## Component Architecture

The framework is organized into the following modules:

- **Core**: Resource, Collection, LinkManager, ResourceState, errors
- **HTTP**: Router, Request utilities, Response utilities, Content-Type handling
- **Rendering**: Renderers for different content types, Content negotiation
- **Util**: Validation, Serialization, URI templates
- **Server**: Web server implementation

## API Reference

See the [API Reference](./docs/api-reference.md) for detailed documentation of all components.

## Examples

See the [examples](./examples) directory for more examples:

- [Basic API](./examples/basic-api.js) - Simple CRUD API
- [State Machine](./examples/state-machine.js) - API with state transitions
- [Content Negotiation](./examples/content-negotiation.js) - API with multiple representations

## Comparison with Original Implementation

This framework addresses several issues from the original implementation:

1. **Simplified Architecture**: Clearer separation of concerns
2. **Web Standards Based**: Uses standard Request/Response objects
3. **No External Dependencies**: Built on pure JavaScript and Web APIs
4. **Consistent Error Handling**: Standardized error system
5. **Better Resource Management**: Improved resource creation and manipulation
6. **Cleaner Content Negotiation**: Simplified negotiation system
7. **Enhanced Documentation**: Better JSDoc comments and examples

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.