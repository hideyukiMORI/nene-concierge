<?php

declare(strict_types=1);

namespace NeNeConcierge\Session;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /api/v1/sessions/{session_id}
 *
 * Returns a session together with its full message history and collected variables.
 */
final readonly class GetSessionDetailHandler implements RequestHandlerInterface
{
    public function __construct(
        private ChatSessionRepositoryInterface    $sessions,
        private SessionMessageRepositoryInterface $messages,
        private JsonResponseFactory               $response,
        private ProblemDetailsResponseFactory     $problem,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId     = (int) $request->getAttribute('nene2.org.id', 0);
        $sessionId = (string) Router::param($request, 'session_id');

        $session = $this->sessions->findById($sessionId, $orgId);

        if ($session === null) {
            return $this->problem->create($request, 'session-not-found', 'Session not found', 404);
        }

        $messages = $this->messages->findBySession($sessionId, $orgId);

        return $this->response->create([
            'data' => [
                'id'             => $session->id,
                'scenario_id'    => $session->scenarioId,
                'outcome'        => $session->outcome->value,
                'has_conversion' => $session->hasConversion,
                'started_at'     => $session->startedAt,
                'ended_at'       => $session->endedAt,
                'variables'      => $session->variables,
                'messages'       => array_map(
                    static fn (SessionMessage $m): array => [
                        'id'         => $m->id,
                        'role'       => $m->role->value,
                        'content'    => $m->content,
                        'node_id'    => $m->nodeId,
                        'created_at' => $m->createdAt,
                    ],
                    $messages,
                ),
            ],
        ]);
    }
}
