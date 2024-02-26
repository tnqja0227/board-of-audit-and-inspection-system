# KAIST 감사원 시스템 아키텍처

## 시스템 구성요소

![architecture](/assets/architecture.png)

메인 데이터베이스로 `postgreSQL`을 사용하고 있으며 세션 데이터베이스로 `redis`를 사용하고 있습니다.

## API 서버

API 서버는 `Node.js` 및 `Express.js`를 기반으로 제작되었으며 `TypeScript`를 사용하고 있습니다.

### 파일 구조

```
src
├── config
├── controller
├── db
├── dto
├── middleware
├── model
├── repository
├── routes
├── service
└── utils
test
├── middleware
├── mock
└── routes
    └── budget
swagger
└── routes

```

API 서버는 크게 `routes`, `controller`, `service`, `repository` 레이어로 나눌 수 있습니다.

-   `routes` 레이어는 API의 엔드포인트와 미들웨어의 호출 순서를 관리합니다.
-   `controller` 레이어는 request의 파라미터를 이용해 `DTO`를 생성하고 비즈니스 로직을 호출합니다.
-   `service` 레이어는 비즈니스 로직을 정의합니다.
-   `repository` 레이어는 ORM과 API 서버 간의 인터페이스를 정의합니다.

그밖에

-   `model` 폴더에는 ORM의 모델 인스턴스가 정의되어 있습니다.
-   `middlewares` 폴더에는 `Express` 미들웨어들이 정의되어 있습니다.
-   `test` 폴더에는 유닛 테스트 및 통합 테스트 스크립트가 정의되어 있습니다.
-   `swagger` 폴더에는 `swagger` 문서들이 정의되어 있습니다.

### ORM

API 서버는 ORM으로 [`sequelize`](https://sequelize.org/docs/v6/getting-started/)를 사용하고 있습니다.

### 테스트

API 서버는 테스트 프레임워크로 [`mocha`](https://mochajs.org/), [`sinon`](https://sinonjs.org/)를 사용하고 있으며 [`chai`](https://www.chaijs.com/)와 `chai-http` 라이브러리를 사용중입니다.

아래의 명령어로 로컬 환경에서 테스트를 실행하고, 테스트 커버리지를 확인할 수 있습니다.

```bash
docker compose -f compose-dev.yaml up --build
npm test
```

### Swagger

API 서버는 API Documentation을 위해 `Swagger`를 사용하고 있습니다.

-   [Swagger Documentation](https://swagger.io/specification/v3/)
-   [KAIST 감사원 시스템 API documentation](https://dev-bai.gdsckaist.com/api-docs)
