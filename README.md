# Entrance Decorator

A minimal solution of dependency injection for projects that scale.

## Why

🙂

## Installation

```
yarn add entrance-decorator
```

## Usage

### Define entrances

```ts
import {entrance} from 'entrance-decorator';

export class Entrances {
  constructor(private url: string) {}

  @entrance
  get uiService() {
    return new UIService(this.errorService);
  }

  @entrance
  get errorService() {
    return new ErrorService({
      baseURL: this.url,
    });
  }
}
```

### Extend/override entrances

```ts
import {entrance} from 'entrance-decorator';

export class MobileEntrances extends Entrances {
  // Extend entrance
  @entrance
  get mobileService() {
    return new MobileService(this.errorService);
  }

  // Override entrance
  @entrance
  get uiService() {
    return new MobileUIService(this.errorService);
  }
}
```

### Use entrances

```ts
const entrances = new Entrances('https://makeflow.com');
```

You may use the `entrances` object in whatever way you want. For example, we use `Context` in React (in a decorator manner) and use something like `entrances.launchServer()` in server-side applications.

## What it does

Cache and circular dependency check, nothing else.

## License

MIT License.
