# Memos Example

This is an example application built with HyperDeno that demonstrates the HATEOAS features of the framework. It's a simple memos application that allows users to create, edit, delete memos and add comments to them.

## Features

- Create, read, update, and delete memos
- Add comments to memos
- Edit and delete comments
- HATEOAS-driven navigation
- In-memory data storage
- HTML representation of resources

## Running the Example

To run this example, you'll need Deno installed on your system. Then, you can start the server with:

```bash
deno run --allow-net server.ts
```

The server will start on `http://localhost:8000`.

## API Endpoints

### Memos

- `GET /memos` - List all memos
- `GET /memos/new` - Show form to create a new memo
- `POST /memos` - Create a new memo
- `GET /memos/:id` - View a specific memo
- `GET /memos/:id/edit` - Show form to edit a memo
- `PUT /memos/:id` - Update a memo
- `DELETE /memos/:id` - Delete a memo

### Comments

- `GET /memos/:id/comments` - List comments for a memo
- `GET /memos/:id/comments/new` - Show form to add a new comment
- `POST /memos/:id/comments` - Add a new comment
- `GET /memos/:id/comments/:commentId/edit` - Show form to edit a comment
- `PUT /memos/:id/comments/:commentId` - Update a comment
- `DELETE /memos/:id/comments/:commentId` - Delete a comment

## HATEOAS Features

This example demonstrates several HATEOAS concepts:

1. Resource Representations: Each resource (memo and comment) is represented with its own HTML template
2. Hypermedia Controls: All actions are available through links and forms
3. State Transitions: The application guides users through state transitions using forms and links
4. Resource Relationships: Comments are linked to their parent memos
5. Standard Link Relations: Uses standard link relations like `self`, `edit`, and `delete`

## Project Structure

```
memos/
├── server.ts              # Main server file
├── resources/            # Resource definitions
│   ├── memo.ts          # Memo resource
│   └── comment.ts       # Comment resource
├── services/            # Business logic
│   ├── memo_service.ts  # Memo service
│   └── comment_service.ts # Comment service
└── templates/           # HTML templates
    ├── memo_list.html   # List of memos
    ├── memo_form.html   # Memo create/edit form
    ├── comment_list.html # List of comments
    └── comment_form.html # Comment create/edit form
``` 