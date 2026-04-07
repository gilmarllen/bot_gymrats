# Development Guidelines

## Testing in Development

Before running the dev server, always update Workout `133590219` to have `created_at` set to the current time:

```python
import json
from datetime import datetime, timezone

now = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f') + 'Z'

for path in [
    'src/mock/workout.json',
    'src/mock/challenges/workouts.json'
]:
    with open(path) as f:
        d = json.load(f)
    if isinstance(d['data'], list):
        for w in d['data']:
            if w['id'] == 133590219:
                w['created_at'] = now
    elif d['data']['id'] == 133590219:
        d['data']['created_at'] = now
    with open(path, 'w') as f:
        json.dump(d, f, indent=2)
```

Then start the dev server:

```bash
npm run serve
```
