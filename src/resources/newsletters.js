/**
 * Operations for newsletters, collaboration, locks, shared drafts, and attachments.
 */
export class NewslettersResource {
  constructor(transport) {
    this.transport = transport;
  }

  list({ page, perPage, status } = {}) {
    return this.transport.requestJson("GET", "/newsletters", {
      query: { page, per_page: perPage, status },
    });
  }

  create(data) {
    return this.transport.requestJson("POST", "/newsletters", { jsonBody: data });
  }

  get(newsletterId) {
    return this.transport.requestJson("GET", `/newsletters/${newsletterId}`);
  }

  update(newsletterId, data) {
    return this.transport.requestJson("PATCH", `/newsletters/${newsletterId}`, {
      jsonBody: data,
    });
  }

  delete(newsletterId) {
    return this.transport.requestNone("DELETE", `/newsletters/${newsletterId}`);
  }

  addToArchive(newsletterId) {
    return this.transport.requestJson("POST", `/newsletters/${newsletterId}/archive`);
  }

  removeFromArchive(newsletterId) {
    return this.transport.requestJson("DELETE", `/newsletters/${newsletterId}/archive`);
  }

  duplicate(newsletterId) {
    return this.transport.requestJson("POST", `/newsletters/${newsletterId}/duplicate`);
  }

  sendPreview(newsletterId) {
    return this.transport.requestJson("POST", `/newsletters/${newsletterId}/preview`);
  }

  send(newsletterId) {
    return this.transport.requestJson("POST", `/newsletters/${newsletterId}/send`);
  }

  sendToNewSubscribers(newsletterId) {
    return this.transport.requestJson(
      "POST",
      `/newsletters/${newsletterId}/send-to-new-subscribers`,
    );
  }

  schedule(newsletterId, scheduledFor) {
    return this.transport.requestJson("POST", `/newsletters/${newsletterId}/schedule`, {
      jsonBody: { scheduled_for: scheduledFor },
    });
  }

  cancelSchedule(newsletterId) {
    return this.transport.requestJson("DELETE", `/newsletters/${newsletterId}/schedule`);
  }

  pin(newsletterId) {
    return this.transport.requestJson("POST", `/newsletters/${newsletterId}/pin`);
  }

  unpin(newsletterId) {
    return this.transport.requestJson("DELETE", `/newsletters/${newsletterId}/pin`);
  }

  listCollaborators(newsletterId) {
    return this.transport.requestJson("GET", `/newsletters/${newsletterId}/collaborators`);
  }

  inviteCollaborator(newsletterId, emailAddress) {
    return this.transport.requestJson("POST", `/newsletters/${newsletterId}/collaborators`, {
      jsonBody: { email_address: emailAddress },
    });
  }

  revokeCollaborator(newsletterId, collaboratorId) {
    return this.transport.requestNone(
      "DELETE",
      `/newsletters/${newsletterId}/collaborators/${collaboratorId}`,
    );
  }

  acquireLock(newsletterId) {
    return this.transport.requestJson("POST", `/newsletters/${newsletterId}/lock`);
  }

  releaseLock(newsletterId) {
    return this.transport.requestNone("DELETE", `/newsletters/${newsletterId}/lock`);
  }

  refreshLock(newsletterId) {
    return this.transport.requestJson("PATCH", `/newsletters/${newsletterId}/lock/heartbeat`);
  }

  listShared() {
    return this.transport.requestJson("GET", "/shared-newsletters");
  }

  uploadAttachment(filePath) {
    return this.transport.requestJson("POST", "/newsletters/attachments", {
      fileUpload: { filePath },
    });
  }
}
