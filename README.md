# poc-architecture
Proof of Concept for Scalability Architecture Stream

## Setup

This project uses yarn workspaces to manage the dependencies. Common `DevDependencies` are captured in the root level `package.json` to ensure that the same tool-set is used to build and test each package. Run the following in the root of the project to install the dependencies and link packages.

```sh
yarn install
```

You can build all the packages by running

```sh
yarn workspaces run build
```

**Note:** The order of the workspaces array in the root `package.json` specifies the build order.

### Scoping
You can use yarn to scope to a specific workspace e.g.
```sh
yarn workspace participants test
```