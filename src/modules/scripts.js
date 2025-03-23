const http = require('node:http');
const url = require('node:url');

const routes = {
    GET: {},
    POST: {},
    PUT: {},
    PATCH: {},
    DELETE: {}
};

const middlewares = [];

function createApp() {
    const app = {
        get: (path, handler) => addRoute('GET', path, handler),
        post: (path, handler) => addRoute('POST', path, handler),
        put: (path, handler) => addRoute('PUT', path, handler),
        patch: (path, handler) => addRoute('PATCH', path, handler),
        delete: (path, handler) => addRoute('DELETE', path, handler),
        use: (middleware) => {
            middlewares.push(middleware);
        },
        listen: (port, callback) => {
            const server = http.createServer((req, res) => {
                req.body = '';
                req.params = {};
                req.query = {};

                const parsedUrl = url.parse(req.url, true);
                req.query = parsedUrl.query;

                const pathParts = parsedUrl.pathname.split('/').filter(part => part);
                const pathParams = req.url.match(/\/([^\/]+)\/([^\/]+)/);
                if (pathParams) {
                    req.params[pathParams[1]] = pathParams[2];
                }

                res.send = (data) => {
                    res.setHeader('Content-Type', 'text/plain');
                    res.end(data);
                };

                res.json = (data) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                };

                res.status = (code) => {
                    res.statusCode = code;
                    return res;
                };

                req.on('data', chunk => {
                    req.body += chunk.toString();
                });

                req.on('end', () => {
                    const method = req.method;
                    const url = req.url;

                    const next = (err) => {
                        if (err) {
                            console.error(`Ошибка: ${err.message}`);
                            res.writeHead(500, {'Content-Type': 'application/json'});
                            res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
                            return;
                        }

                        const middleware = middlewares.shift();
                        if (middleware) {
                            middleware(req, res, next);
                        } else {
                            const handler = routes[method][url];
                            if (handler) {
                                handler(req, res, next);
                            } else {
                                res.writeHead(404, {'Content-Type': 'application/json'});
                                console.log('Response: Not Found');
                                res.end(JSON.stringify({ error: 'Not Found', message: 'Route not found' }));
                            }
                        }
                    };
                    next();
                });
            });

            server.listen(port, () => {
                console.log(`Сервер работает на порту ${port}`);
                if (callback) {
                    callback();
                }
            });
        }
    };

    return app;
}

function addRoute(method, path, handler) {
    if (routes[method]) {
        routes[method][path] = handler;
    } else {
        console.log(`Метод ${method} не поддерживается`);
    }
}

const app = createApp();

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use((req, res, next) => {
    res.setHeader('X-Custom-Header', 'MiddlewareExample');
    next();
});

app.get('/hello', (req, res, next) => {
    try {
        const resMessage = 'Hello\n';
        console.log(`Ответ: ${resMessage}`);
        res.send(resMessage);
    } catch (error) {
        next(error);
    }
});

app.post('/data', (req, res, next) => {
    try {
        console.log(`Полученные данные: ${req.body}`);
        if (!req.body) {
            throw new Error('Отсутствует тело запроса');
        }
        res.send(`Данные приняты: ${req.body}\n`);
    } catch (error) {
        next(error);
    }
});

app.put('/update', (req, res, next) => {
    try {
        console.log(`Обновлённые данные: ${req.body}`);
        if (!req.body) {
            throw new Error('Отсутствует тело запроса');
        }
        res.send(`Данные обновлены: ${req.body}\n`);
    } catch (error) {
        next(error);
    }
});

app.patch('/modify', (req, res, next) => {
    try {
        console.log(`Измененные данные: ${req.body}`);
        if (!req.body) {
            throw new Error('Отсутствует тело запроса');
        }
        res.send(`Данные изменены: ${req.body}\n`);
    } catch (error) {
        next(error);
    }
});

app.delete('/remove', (req, res, next) => {
    try {
        const reqMessage = 'Данные удалены';
        console.log(reqMessage);
        res.send(reqMessage);
    } catch (error) {
        next(error);
    }
});

app.listen(8080, () => {
    console.log('Сервер запущен');
});