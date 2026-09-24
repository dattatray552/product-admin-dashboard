 Product Admin Dashboard

A responsive product management dashboard built with **Next.js, React, Tailwind CSS, and Axios** using the free **DummyJSON API**.
 Features

<!-- Authentication -->

* Login using DummyJSON authentication API.
* Demo credentials:

  * Username: `emilys`
  * Password: `emilyspass`
* Access token is stored in `localStorage`.
* Protected product pages redirect unauthenticated users to the login page.
* Logout removes the stored token.
* Login button prevents duplicate requests while login is in progress.

## Product Management

* View products in a responsive table on desktop.
* Responsive product cards on mobile.
* Product information includes:

  * Image
  * Title
  * Category
  * Price
  * Rating
  * Stock
* Product details page.
* Add new product.
* Edit existing product.
* Delete product with confirmation.
* Form validation for product data.
* Save buttons prevent duplicate submissions.

### Search, Filter and Sort

* Product search using the DummyJSON search API.
* Debounced search input.
* Category filtering.
* Category list loaded from the API.
* Sorting by:

  * Price: Low to High
  * Price: High to Low
  * Rating: Low to High
  * Rating: High to Low
  * Title: A to Z
  * Title: Z to A

### Pagination

* Page sizes:

  * 10
  * 20
  * 50
* Previous and Next buttons.
* Page number navigation.
* Displays the current range, for example:

  * `Showing 21–40 of 194`
* Invalid page values are handled safely.

### Loading and Error Handling

* Loading state while API requests are running.
* Empty state when no products are found.
* Error message when an API request fails.
* Retry option for failed product requests.
* Invalid product IDs are handled with a Product Not Found state.

## Tech Stack

* Next.js
* React
* JavaScript
* Tailwind CSS
* Axios
* DummyJSON API

#\ API

The application uses:

`https://dummyjson.com`

Important endpoints:

<!-- ```text -->
POST /auth/login

GET /products

GET /products/search?q={query}

GET /products/categories

GET /products/category/{category}

GET /products/{id}

POST /products/add

PUT /products/{id}

DELETE /products/{id}
```

All API requests are handled through a shared Axios instance.

<!-- ## Axios Configuration -->

A shared Axios instance is created in:

<!-- ```text -->
<!-- app/lib/api.js -->
```

The Axios instance:

* Uses DummyJSON as the base URL.
* Adds the authentication token to requests using an Axios request interceptor.
* Handles API errors using a response interceptor.

This avoids repeating Axios configuration throughout the application.

# URL State

Product list state is reflected in the URL.

Examples:

<!-- /text -->
/products?page=2

/products?search=phone

/products?category=smartphones

/products?sort=price-asc

/products?page=2&category=smartphones&sort=price-asc
```

This allows the current page, search, category and sorting state to be represented by the URL.

Invalid page values such as:

<!-- text -->
/products?page=abc


are safely converted to page 1.

If a page number is greater than the available number of pages, the application moves to the last valid page.

<!-- ## Debounced Search -->

Search input uses a debounce of approximately 500 milliseconds.

Instead of making an API request for every typed character, the application waits until the user stops typing.

Example:

<!-- text -->
p
ph
pho
phon
phone


The application waits briefly and then performs the search.

This reduces unnecessary API requests.

## Stale Search Response Handling

The assignment requires handling slow or stale search responses.

The application uses a request ID with React's `useRef`.

Each request receives a unique request ID.

Before updating the UI, the response is checked against the latest request ID.

If an older request finishes after a newer request, its result is ignored.

This prevents an old search response from replacing a newer search result.

## Search and Category Limitation

DummyJSON provides separate search and category endpoints.

The application therefore fetches the appropriate dataset and applies the remaining filtering on the client side when necessary.

This decision keeps search and category behavior predictable within the API limitations.

## Product Mutation Persistence

DummyJSON product mutations such as Add, Edit and Delete are simulated by the API and are not permanently persisted by DummyJSON.

To provide a consistent experience inside the application:

* Added products are stored in `localStorage`.
* Edited product data is stored in `localStorage`.
* Deleted product IDs are tracked in `localStorage`.

Therefore, product changes remain visible during use of the application even though the external DummyJSON database is not permanently modified.

## Responsive Design

The dashboard is responsive.

### Desktop

Products are displayed in a table.

### Mobile

Products are displayed as cards for better usability on smaller screens.

Tailwind CSS responsive utility classes are used to implement the layout.

## Project Structure
<!-- text -->
product-admin-dashboard/
│
├── app/
│   ├── lib/
│   │   ├── api.js
│   │   └── auth.js
│   │
│   ├── login/
│   │   └── page.js
│   │
│   ├── products/
│   │   ├── [id]/
│   │   │   └── page.js
│   │   │
│   │   ├── edit/
│   │   │   └── [id]/
│   │   │       └── page.js
│   │   │
│   │   ├── new/
│   │   │   └── page.js
│   │   │
│   │   └── page.js
│   │
│   └── page.js
│
├── public/
├── package.json
└── README.md
```

## Installation

Clone the repository:

bash
git clone YOUR_GITHUB_REPOSITORY_URL


Move into the project:

bash
cd product-admin-dashboard


Install dependencies:

bash
npm install


Start the development server:

bash
npm run dev


Open:
text
http://localhost:3000


## Demo Login

text
Username: emilys
Password: emilyspass


## Main Application Flow

text
Login
  ↓
POST /auth/login
  ↓
Store access token
  ↓
Products Dashboard
  ↓
Fetch products
  ↓
Search / Filter / Sort
  ↓
Pagination
  ↓
View Product Details
  ↓
Add / Edit / Delete


## Important Design Decisions

## Shared Axios Instance

A single Axios instance is used so authentication and error handling can be managed centrally.

## URL-Based State

Search, category, sorting and pagination are represented in the URL so the current list state can be preserved and shared.

## Local Storage for Mutations

Because DummyJSON does not permanently persist product mutations, local storage is used to reflect changes inside the application.

## Duplicate Request Prevention

Login and product save operations are protected against accidental duplicate submissions.

## Stale Response Protection

Request IDs prevent older asynchronous search responses from overwriting newer results.

## AI Usage

AI tools were used during development for assistance with implementation, debugging, and understanding the assignment requirements.

All generated code was reviewed, tested, and understood before being included in the project.

The developer can explain the application flow, API integration, React state management, Axios interceptors, URL state, pagination, debounced search, stale response handling, localStorage persistence, and CRUD operations.

## Status

The project is developed as a technical assignment demonstrating:

* React and Next.js development
* REST API integration
* Axios
* Authentication
* CRUD operations
* Search
* Filtering
* Sorting
* Pagination
* Responsive UI
* Error handling
* Async request handling
* Local storage
* URL state management
