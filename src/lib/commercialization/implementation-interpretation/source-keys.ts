export function workstreamSourceKey(workstreamType: string): string {
  return `workstream:${workstreamType}`;
}

export function actionSourceKey(
  workstreamType: string,
  actionId: string,
): string {
  return `action:${workstreamType}:${actionId}`;
}

export function preservationSourceKey(category: string): string {
  return `preservation:${category}`;
}
