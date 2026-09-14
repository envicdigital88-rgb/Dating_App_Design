'use client';

import React, { useState } from 'react';
                              }`}
                            >
                              {last
                                ? last.deleted
                                  ? 'Mingle deleted'
                                  : last.imageUrl && !last.body
                                  ? 'Sent a photo'
                                  : last.body
                                : 'Say hello'}
                            </span>
                            {!!unread && (
                              <span className="shrink-0 rounded-full bg-berry-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                                {unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
                {filteredConversations.length === 0 && searchQuery !== '' && (
                  <div className="py-8 text-center text-sm text-ink-muted">
                    No friends found matching "{searchQuery}".
                  </div>
                )}
              </ul>
            </div>
          )}
        </div>

        <aside className="hidden space-y-5 lg:block">
          <div className="rounded-4xl bg-cream-deep p-5 shadow-card">
            <h2 className="mb-4 font-display text-lg text-ink">Chat allowance</h2>
            <UsageMeter
              label="Mingles remaining"
              used={entitlements.chatUsed}
              limit={entitlements.chatLimit}
            />
            <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">
              {entitlements.chatLimit === null
                ? 'Your package includes unlimited mingles.'
                : `You have used ${entitlements.chatUsed} of ${entitlements.chatLimit} mingles on the ${entitlements.packageName} package.`}
            </p>
            {entitlements.chatRemaining !== null && (
              <Button
                size="sm"
                block
                className="mt-4"
                variant={entitlements.chatRemaining === 0 ? 'primary' : 'outline'}
                onClick={() => router.push('/packages')}
              >
                {entitlements.chatRemaining === 0 ? 'Upgrade to keep chatting' : 'See packages'}
              </Button>
            )}
          </div>
        </aside>
      </div>

      {showAddStatus && <AddStatusModal onClose={() => setShowAddStatus(false)} />}
      {viewingStatusUserId && <StatusViewer userId={viewingStatusUserId} onClose={() => setViewingStatusUserId(null)} />}
    </Page>
  );
}
