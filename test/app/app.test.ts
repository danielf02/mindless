import * as TypeMoq from 'typemoq'
import { CustomErrorHandler } from '../../src/error/custom-error-handler'
import { GenericConstructor } from '../../src/interfaces'
import { Dispatcher } from '../../src/app'
import {
  App,
  Controller,
  HttpMethods,
  IContainer,
  IRouter,
  Middleware,
  Request,
  Response,
  RouteUrl
} from '../../src/mindless'

describe('App', () => {
  const containerMock = TypeMoq.Mock.ofType<IContainer>()
  const routerMock = TypeMoq.Mock.ofType<IRouter>()
  const genericMock = TypeMoq.Mock.ofType<GenericConstructor<string>>()
  beforeEach(() => {
    containerMock.reset()
    routerMock.reset()
    genericMock.reset()
  })

  test('App gets constructed', () => {
    const app = new App(containerMock.object, routerMock.object)
    expect(app).toBeInstanceOf(App)
  })

  test('App resolve', () => {
    const app = new App(containerMock.object, routerMock.object)

    containerMock
      .setup(c => c.resolve(TypeMoq.It.isAny()))
      .returns(() => 'abc')
      .verifiable(TypeMoq.Times.once())

    const str = app.resolve(genericMock.object)

    expect(str).toBe('abc')

    containerMock.verifyAll()
  })
})

describe('App handle request', () => {
  const requestMock = TypeMoq.Mock.ofType<Request>()
  const containerMock = TypeMoq.Mock.ofType<IContainer>()
  const routerMock = TypeMoq.Mock.ofType<IRouter>()
  const controllerConstructorMock = TypeMoq.Mock.ofType<GenericConstructor<Controller>>()
  const middlewareConstructorMock = TypeMoq.Mock.ofType<GenericConstructor<Middleware>>()
  const dispatchMiddlewareMock = TypeMoq.Mock.ofInstance(Dispatcher.dispatchMiddleware)
  const dispatchControllerMock = TypeMoq.Mock.ofInstance(Dispatcher.dispatchController)
  beforeEach(() => {
    requestMock.reset()
    containerMock.reset()
    routerMock.reset()
    controllerConstructorMock.reset()
    middlewareConstructorMock.reset()
    dispatchMiddlewareMock.reset()
    dispatchControllerMock.reset()
  })

  test('successfully handle request', async () => {
    const app = new App(containerMock.object, routerMock.object)

    Dispatcher.dispatchMiddleware = dispatchMiddlewareMock.object
    Dispatcher.dispatchController = dispatchControllerMock.object

    const data = {
      route: {
        url: new RouteUrl(''),
        method: HttpMethods.GET,
        function: 'test',
        controller: controllerConstructorMock.object,
        middleware: [middlewareConstructorMock.object]
      },
      params: []
    }

    routerMock
      .setup(r => r.getRouteData(requestMock.object))
      .returns(() => data)
      .verifiable(TypeMoq.Times.once())

    dispatchMiddlewareMock
      .setup(m => m(containerMock.object, requestMock.object, data.route.middleware))
      .verifiable(TypeMoq.Times.once())

    dispatchControllerMock
      .setup(c => c(containerMock.object, requestMock.object, data.route, data.params))
      .returns(() => Promise.resolve(new Response()))
      .verifiable(TypeMoq.Times.once())

    const response = await app.handleRequest(requestMock.object)

    expect(response).toBeInstanceOf(Response)
    expect(response.statusCode).toBe(200)

    routerMock.verifyAll()
    dispatchMiddlewareMock.verifyAll()
    dispatchControllerMock.verifyAll()
  })

  test('successfully handle request without middleware', async () => {
    const app = new App(containerMock.object, routerMock.object)

    Dispatcher.dispatchController = dispatchControllerMock.object

    const data = {
      route: {
        url: new RouteUrl(''),
        method: HttpMethods.GET,
        function: 'test',
        controller: controllerConstructorMock.object
      },
      params: []
    }

    routerMock
      .setup(r => r.getRouteData(requestMock.object))
      .returns(() => data)
      .verifiable(TypeMoq.Times.once())

    dispatchControllerMock
      .setup(c => c(containerMock.object, requestMock.object, data.route, data.params))
      .returns(() => Promise.resolve(new Response()))
      .verifiable(TypeMoq.Times.once())

    const response = await app.handleRequest(requestMock.object)

    expect(response).toBeInstanceOf(Response)
    expect(response.statusCode).toBe(200)

    routerMock.verifyAll()
    dispatchControllerMock.verifyAll()
  })

  test('middleware rejects with response', async () => {
    const app = new App(containerMock.object, routerMock.object)

    Dispatcher.dispatchMiddleware = dispatchMiddlewareMock.object
    Dispatcher.dispatchController = dispatchControllerMock.object

    const data = {
      route: {
        url: new RouteUrl(''),
        method: HttpMethods.GET,
        function: 'test',
        controller: controllerConstructorMock.object,
        middleware: [middlewareConstructorMock.object]
      },
      params: []
    }

    const errorMsg = 'error message'

    routerMock
      .setup(r => r.getRouteData(requestMock.object))
      .returns(() => data)
      .verifiable(TypeMoq.Times.once())

    dispatchMiddlewareMock
      .setup(m => m(containerMock.object, requestMock.object, data.route.middleware))
      .returns(() => Promise.reject(new Response(399, { rejected: errorMsg })))
      .verifiable(TypeMoq.Times.once())

    dispatchControllerMock
      .setup(c => c(containerMock.object, requestMock.object, data.route, data.params))
      .throws(new Error(errorMsg))
      .verifiable(TypeMoq.Times.never())

    const response = await app.handleRequest(requestMock.object)

    expect(response).toBeInstanceOf(Response)
    expect(response.statusCode).toBe(399)
    expect(response.body.rejected).toEqual(errorMsg)

    routerMock.verifyAll()
    dispatchMiddlewareMock.verifyAll()
    dispatchControllerMock.verifyAll()
  })

  test('error with default error handler', async () => {
    const app = new App(containerMock.object, routerMock.object)

    Dispatcher.dispatchMiddleware = dispatchMiddlewareMock.object
    Dispatcher.dispatchController = dispatchControllerMock.object

    const data = {
      route: {
        url: new RouteUrl(''),
        method: HttpMethods.GET,
        function: 'test',
        controller: controllerConstructorMock.object,
        middleware: [middlewareConstructorMock.object]
      },
      params: []
    }

    const errorMsg = 'error message'

    routerMock
      .setup(r => r.getRouteData(requestMock.object))
      .returns(() => data)
      .verifiable(TypeMoq.Times.once())

    dispatchMiddlewareMock
      .setup(m => m(containerMock.object, requestMock.object, data.route.middleware))
      .verifiable(TypeMoq.Times.once())

    dispatchControllerMock
      .setup(c => c(containerMock.object, requestMock.object, data.route, data.params))
      .throws(new Error(errorMsg))
      .verifiable(TypeMoq.Times.once())

    const response = await app.handleRequest(requestMock.object)

    expect(response).toBeInstanceOf(Response)
    expect(response.statusCode).toBe(500)
    expect(response.body.message).toMatch(/An error occurred/)
    expect(response.body.message).toMatch(/using default error handler/)

    routerMock.verifyAll()
    dispatchMiddlewareMock.verifyAll()
    dispatchControllerMock.verifyAll()
  })

  test('error with custom error handler', async () => {
    const key = 'key'
    const value = 'special request value'

    const customErrorHandler: CustomErrorHandler = (e: Error, request: Request) => {
      return new Response(200, { message: `request value: ${request.get(key)}` })
    }

    const app = new App(containerMock.object, routerMock.object, customErrorHandler)

    Dispatcher.dispatchMiddleware = dispatchMiddlewareMock.object
    Dispatcher.dispatchController = dispatchControllerMock.object

    const data = {
      route: {
        url: new RouteUrl(''),
        method: HttpMethods.GET,
        function: 'test',
        controller: controllerConstructorMock.object,
        middleware: [middlewareConstructorMock.object]
      },
      params: []
    }

    const errorMsg = 'error message'

    requestMock
      .setup(r => r.get(key))
      .returns(() => value)
      .verifiable(TypeMoq.Times.once())

    routerMock
      .setup(r => r.getRouteData(requestMock.object))
      .returns(() => data)
      .verifiable(TypeMoq.Times.once())

    dispatchMiddlewareMock
      .setup(m => m(containerMock.object, requestMock.object, data.route.middleware))
      .verifiable(TypeMoq.Times.once())

    dispatchControllerMock
      .setup(c => c(containerMock.object, requestMock.object, data.route, data.params))
      .throws(new Error(errorMsg))
      .verifiable(TypeMoq.Times.once())

    process.env.NODE_ENV = 'prod'

    const response = await app.handleRequest(requestMock.object)
    expect(response).toBeInstanceOf(Response)
    expect(response.statusCode).toBe(200)
    expect(response.body.message).toMatch(/request value/)
    expect(response.body.message).toMatch(new RegExp(value))

    requestMock.verifyAll()
    routerMock.verifyAll()
    dispatchMiddlewareMock.verifyAll()
    dispatchControllerMock.verifyAll()
  })
})
