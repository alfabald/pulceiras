<?php
declare(strict_types=1);

require __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Método não permitido.'], 405);
}

require_admin();

$participants = read_participants();
$guests = 0;
$checkedIn = 0;
$pledged = 0.0;
$received = 0.0;

foreach ($participants as $participant) {
    $participantGuests = (int) ($participant['guests'] ?? 0);
    $guests += $participantGuests;
    $contribution = (float) ($participant['contribution'] ?? 0);
    $pledged += $contribution;

    if (!empty($participant['checkedInAt'])) {
        $checkedIn += $participantGuests;
    }

    if (($participant['paymentStatus'] ?? 'Prometido') !== 'Prometido') {
        $received += $contribution;
    }
}

json_response([
    'participants' => $participants,
    'summary' => [
        'registrations' => count($participants),
        'guests' => $guests,
        'checkedIn' => $checkedIn,
        'pledged' => round($pledged, 2),
        'received' => round($received, 2),
    ],
]);
