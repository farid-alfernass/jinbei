# Jinbei

Jinbei is a common helper package for Node.js, designed to streamline common tasks and provide utilities for efficient development.

## Features

- **Wrapper Functions**: Jinbei offers wrapper functions for handling responses (`wrapper.response`), data (`wrapper.data`), and errors (`wrapper.error`), simplifying the handling of these common scenarios in Node.js applications.

- **Logger**: The package includes a logger utility to facilitate logging throughout your application, aiding in debugging and monitoring.

- **Utils Functions**: Jinbei provides various utility functions to assist in common development tasks, making development more efficient and code more maintainable.

## Installation

To install Jinbei, you can use npm:

```bash
npm install jinbei
```

## Usage

```javascript
const jinbei = require('jinbei');

// Example usage of wrapper functions
const responseData = jinbei.response(res, 'success', result, 'Login User', http.OK);;
const errorData = jinbei.errorResponse(new UnauthorizedError('password invalid!'));

// Example usage of logger
jinbei.log(context, err, 'This is an error message');
jinbei.error(context, 'This is an error message', 'function', err);

// Example usage of utility functions
const redisClient = new jinbei.RedisDB(REDIS_CLIENT_CONFIGURATION);
```

## Contributing

Contributions are welcome! If you have suggestions, improvements, or new features to propose, please open an issue or pull request on the [GitHub repository](https://github.com/farid-alfernass/jinbei).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Jinbei is inspired by the need for a comprehensive yet simple helper package for Node.js development. We extend our gratitude to the open-source community for their contributions and support.